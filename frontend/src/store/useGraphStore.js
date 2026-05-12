import { MarkerType, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

const GRID_SIZE = 24;
const NODE_WIDTH = 92;
const NODE_HEIGHT = 92;
const NODE_SPACING_X = 132;
const NODE_SPACING_Y = 132;
const NODE_RADIUS = 46;

function snapToGrid(position) {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
  };
}

function getNodeBounds(node) {
  return {
    left: node.position.x,
    right: node.position.x + NODE_WIDTH,
    top: node.position.y,
    bottom: node.position.y + NODE_HEIGHT
  };
}

function getNodeCenter(position) {
  return {
    x: position.x + NODE_RADIUS,
    y: position.y + NODE_RADIUS
  };
}

function applyMagneticSpacing(nodes, desiredPosition, ignoredId = null) {
  let nextPosition = snapToGrid(desiredPosition);
  let shifted = false;

  for (const node of nodes) {
    if (node.id === ignoredId) {
      continue;
    }

    const currentCenter = getNodeCenter(node.position);
    const nextCenter = getNodeCenter(nextPosition);
    const deltaX = nextCenter.x - currentCenter.x;
    const deltaY = nextCenter.y - currentCenter.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance >= NODE_SPACING_X) {
      continue;
    }

    const pushDistance = NODE_SPACING_X - distance;
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;

    nextPosition = snapToGrid({
      x: nextPosition.x + unitX * pushDistance,
      y: nextPosition.y + unitY * pushDistance
    });
    shifted = true;
  }

  return shifted ? nextPosition : snapToGrid(desiredPosition);
}

function overlapsExisting(nodes, candidate, ignoredId = null) {
  const candidateBounds = {
    left: candidate.x,
    right: candidate.x + NODE_WIDTH,
    top: candidate.y,
    bottom: candidate.y + NODE_HEIGHT
  };

  return nodes.some((node) => {
    if (node.id === ignoredId) {
      return false;
    }

    const bounds = getNodeBounds(node);

    return !(
      candidateBounds.right + 16 < bounds.left ||
      candidateBounds.left - 16 > bounds.right ||
      candidateBounds.bottom + 16 < bounds.top ||
      candidateBounds.top - 16 > bounds.bottom
    );
  });
}

function findAvailablePosition(nodes, desiredPosition, ignoredId = null) {
  const basePosition = snapToGrid(desiredPosition);

  for (let ring = 0; ring <= 6; ring += 1) {
    for (let offsetX = -ring; offsetX <= ring; offsetX += 1) {
      for (let offsetY = -ring; offsetY <= ring; offsetY += 1) {
        if (ring > 0 && Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== ring) {
          continue;
        }

        const candidate = snapToGrid({
          x: basePosition.x + offsetX * NODE_SPACING_X,
          y: basePosition.y + offsetY * NODE_SPACING_Y
        });

        if (!overlapsExisting(nodes, candidate, ignoredId)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function normalizeEdgeId(source, target) {
  return [source, target].sort().join('::');
}

function createGraphNode(nodeNumber, position) {
  return {
    id: `node-${nodeNumber}`,
    type: 'graphNode',
    position,
    data: {
      label: `Node ${nodeNumber}`,
      nodeNumber
    }
  };
}

function createGraphEdge(source, target, weight = 1) {
  return {
    id: normalizeEdgeId(source, target),
    type: 'graphEdge',
    source,
    target,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 24,
      height: 24,
      color: '#67e8f9'
    },
    data: {
      weight
    }
  };
}

function createEmptyRouteAnimation() {
  return {
    visitedNodeIds: [],
    pathNodeIds: [],
    pathEdgeIds: [],
    energizedEdgeIds: []
  };
}

function clearSelections(collection) {
  return collection.map((item) => ({
    ...item,
    selected: false
  }));
}

function areSelectionsEqual(left, right) {
  if (left.nodeIds.length !== right.nodeIds.length || left.edgeIds.length !== right.edgeIds.length) {
    return false;
  }

  return (
    left.nodeIds.every((nodeId, index) => nodeId === right.nodeIds[index]) &&
    left.edgeIds.every((edgeId, index) => edgeId === right.edgeIds[index])
  );
}

export function buildRouteRequest({ nodes, edges, sourceId, destinationId, algorithm }) {
  const orderedNodes = [...nodes].sort(
    (left, right) => (left.data?.nodeNumber ?? 0) - (right.data?.nodeNumber ?? 0)
  );

  const vertexIndexById = new Map(orderedNodes.map((node, index) => [node.id, index]));
  const vertexIdByIndex = orderedNodes.map((node) => node.id);

  return {
    payload: {
      vertices: orderedNodes.length,
      edges: edges
        .filter((edge) => vertexIndexById.has(edge.source) && vertexIndexById.has(edge.target))
        .map((edge) => [
          vertexIndexById.get(edge.source),
          vertexIndexById.get(edge.target),
          Number(edge.data?.weight ?? 1)
        ]),
      source: vertexIndexById.get(sourceId),
      destination: vertexIndexById.get(destinationId),
      algorithm,
      undirected: true
    },
    vertexIdByIndex
  };
}

export function mapRouteResponse(response, vertexIdByIndex) {
  const pathNodeIds = Array.isArray(response.path)
    ? response.path.map((index) => vertexIdByIndex[index]).filter(Boolean)
    : [];
  const visitedNodeIds = Array.isArray(response.nodesVisited)
    ? response.nodesVisited.map((index) => vertexIdByIndex[index]).filter(Boolean)
    : [];
  const pathEdgeIds = [];

  for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
    pathEdgeIds.push(normalizeEdgeId(pathNodeIds[index], pathNodeIds[index + 1]));
  }

  return {
    ...response,
    pathNodeIds,
    visitedNodeIds,
    pathEdgeIds
  };
}

export const useGraphStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nextNodeNumber: 1,
  sourceId: '',
  destinationId: '',
  algorithm: 'dijkstra',
  loading: false,
  error: '',
  interactionMode: 'select',
  selection: {
    nodeIds: [],
    edgeIds: []
  },
  connectionState: {
    active: false,
    sourceId: ''
  },
  routeResult: null,
  routeAnimation: createEmptyRouteAnimation(),
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes)
    }));
  },
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges)
    }));
  },
  addNode: (position) => {
    set((state) => {
      const fallbackSeed = snapToGrid({
        x: state.nodes.length * NODE_SPACING_X * 0.5,
        y: state.nodes.length * NODE_SPACING_Y * 0.35
      });
      const resolvedPosition =
        findAvailablePosition(state.nodes, applyMagneticSpacing(state.nodes, position)) ??
        findAvailablePosition(state.nodes, applyMagneticSpacing(state.nodes, fallbackSeed));

      if (!resolvedPosition) {
        return {
          ...state,
          error: 'No clear space available for a new node. Clear space or move existing nodes first.'
        };
      }

      const nextNode = createGraphNode(state.nextNodeNumber, resolvedPosition);

      return {
        nodes: [...clearSelections(state.nodes), { ...nextNode, selected: true }],
        edges: clearSelections(state.edges),
        nextNodeNumber: state.nextNodeNumber + 1,
        routeResult: null,
        routeAnimation: createEmptyRouteAnimation(),
        error: '',
        selection: {
          nodeIds: [nextNode.id],
          edgeIds: []
        }
      };
    });
  },
  moveNode: (nodeId, desiredPosition) => {
    set((state) => {
      const resolvedPosition = findAvailablePosition(
        state.nodes,
        applyMagneticSpacing(state.nodes, desiredPosition, nodeId),
        nodeId
      );

      if (!resolvedPosition) {
        return state;
      }

      return {
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position: resolvedPosition
              }
            : node
        )
      };
    });
  },
  createOrUpdateEdge: (source, target, weight = 1) => {
    if (!source || !target || source === target) {
      return;
    }

    set((state) => {
      const edgeId = normalizeEdgeId(source, target);
      const existingEdge = state.edges.find((edge) => edge.id === edgeId);
      const nextEdges = existingEdge
        ? state.edges.map((edge) =>
            edge.id === edgeId
              ? {
                  ...edge,
                  source,
                  target,
                  data: {
                    ...edge.data,
                    weight
                  }
                }
              : edge
          )
        : [...clearSelections(state.edges), { ...createGraphEdge(source, target, weight), selected: true }];

      return {
        edges: nextEdges,
        nodes: clearSelections(state.nodes),
        routeResult: null,
        routeAnimation: createEmptyRouteAnimation(),
        selection: {
          nodeIds: [],
          edgeIds: [edgeId]
        },
        error: ''
      };
    });
  },
  updateEdgeWeight: (edgeId, weight) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                weight
              }
            }
          : edge
      ),
      routeResult: null,
      routeAnimation: createEmptyRouteAnimation()
    }));
  },
  removeNodes: (nodeIds) => {
    set((state) => {
      const nextNodeIds = new Set(nodeIds);
      const remainingNodes = state.nodes.filter((node) => !nextNodeIds.has(node.id));
      const remainingEdges = state.edges.filter(
        (edge) => !nextNodeIds.has(edge.source) && !nextNodeIds.has(edge.target)
      );

      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        sourceId: nextNodeIds.has(state.sourceId) ? '' : state.sourceId,
        destinationId: nextNodeIds.has(state.destinationId) ? '' : state.destinationId,
        selection: {
          nodeIds: [],
          edgeIds: []
        },
        routeResult: null,
        routeAnimation: createEmptyRouteAnimation()
      };
    });
  },
  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      selection: {
        nodeIds: [],
        edgeIds: []
      },
      routeResult: null,
      routeAnimation: createEmptyRouteAnimation()
    }));
  },
  setNodePositions: (positionsById) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        positionsById[node.id]
          ? {
              ...node,
              position: snapToGrid(positionsById[node.id])
            }
          : node
      )
    }));
  },
  clearGraph: () => {
    set(() => ({
      nodes: [],
      edges: [],
      nextNodeNumber: 1,
      selection: {
        nodeIds: [],
        edgeIds: []
      },
      sourceId: '',
      destinationId: '',
      routeResult: null,
      routeAnimation: createEmptyRouteAnimation(),
      error: '',
      routeResult: null
    }));
  },
  setSelection: (selection) => {
    set((state) => {
      if (areSelectionsEqual(state.selection, selection)) {
        return state;
      }

      return {
        selection
      };
    });
  },
  clearSelection: () => {
    set((state) => ({
      selection: {
        nodeIds: [],
        edgeIds: []
      },
      nodes: clearSelections(state.nodes),
      edges: clearSelections(state.edges)
    }));
  },
  setSourceId: (sourceId) => set(() => ({ sourceId })),
  setDestinationId: (destinationId) => set(() => ({ destinationId })),
  setAlgorithm: (algorithm) => set(() => ({ algorithm })),
  setInteractionMode: (interactionMode) => set(() => ({ interactionMode })),
  setLoading: (loading) => set(() => ({ loading })),
  setError: (error) => set(() => ({ error })),
  setConnectionState: (connectionState) => set(() => ({ connectionState })),
  setRouteResult: (routeResult) =>
    set(() => ({
      routeResult
    })),
  setRouteAnimation: (routeAnimation) =>
    set((state) => ({
      routeAnimation:
        typeof routeAnimation === 'function' ? routeAnimation(state.routeAnimation) : routeAnimation
    }))
}));
