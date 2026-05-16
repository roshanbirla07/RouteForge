import { MarkerType, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

const NODE_WIDTH = 92;
const NODE_HEIGHT = 92;
const NODE_SPACING_X = 132;
const NODE_SPACING_Y = 132;

function normalizeEdgeId(source, target, index) {
  return `edge-${source}-${target}-${index}`;
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

function createGraphEdge(source, target, index, weight = 1) {
  return {
    id: normalizeEdgeId(source, target, index),
    type: 'graphEdge',
    source,
    target,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#475569'
    },
    data: {
      source,
      target,
      weight
    }
  };
}

function clearSelections(collection) {
  return collection.map((item) => ({
    ...item,
    selected: false
  }));
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

export const useGraphStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nextNodeNumber: 1,
  nextEdgeNumber: 1,
  
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
      const nextNode = createGraphNode(state.nextNodeNumber, position);
      return {
        nodes: [...clearSelections(state.nodes), { ...nextNode, selected: true }],
        edges: clearSelections(state.edges),
        nextNodeNumber: state.nextNodeNumber + 1
      };
    });
  },
  moveNode: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      )
    }));
  },
  createOrUpdateEdge: (source, target, weight = 1) => {
    if (!source || !target || source === target) return;

    set((state) => {
      const edgeId = normalizeEdgeId(source, target, state.nextEdgeNumber);
      const newEdge = createGraphEdge(source, target, state.nextEdgeNumber, weight);
      
      return {
        edges: [...clearSelections(state.edges), { ...newEdge, selected: true }],
        nodes: clearSelections(state.nodes),
        nextEdgeNumber: state.nextEdgeNumber + 1
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
      )
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
        edges: remainingEdges
      };
    });
  },
  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId)
    }));
  },
  setNodePositions: (positionsById) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        positionsById[node.id]
          ? {
              ...node,
              position: positionsById[node.id]
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
      nextEdgeNumber: 1
    }));
  }
}));
