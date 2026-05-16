import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  useViewport
} from '@xyflow/react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY
} from 'd3-force';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { useUIStore } from '../store/useUIStore';
import ConnectionLine from './ConnectionLine';
import GraphEdge from './GraphEdge';
import GraphNode from './GraphNode';
import { getCircleIntersection, getClosestHandleId, getNodeCenter } from '../utils/graphGeometry';

const nodeTypes = {
  graphNode: GraphNode
};

const edgeTypes = {
  graphEdge: GraphEdge
};

function hasSameItems(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((item, index) => item === right[index]);
}

export default function GraphEditor() {
  const wrapperRef = useRef(null);
  const reactFlow = useReactFlow();
  const viewport = useViewport();
  
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const moveNode = useGraphStore((state) => state.moveNode);
  const removeNodes = useGraphStore((state) => state.removeNodes);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const setNodePositions = useGraphStore((state) => state.setNodePositions);

  const interactionMode = useUIStore((state) => state.interactionMode);
  const selection = useUIStore((state) => state.selection);
  const setSelection = useUIStore((state) => state.setSelection);
  const setConnectionState = useUIStore((state) => state.setConnectionState);
  const hoveredNodeId = useUIStore((state) => state.hoveredNodeId);
  const setHoveredNodeId = useUIStore((state) => state.setHoveredNodeId);
  const draftConnection = useUIStore((state) => state.draftConnection);
  const setDraftConnection = useUIStore((state) => state.setDraftConnection);
  const pendingEdge = useUIStore((state) => state.pendingEdge);
  const setPendingEdge = useUIStore((state) => state.setPendingEdge);

  const editorNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          interactionMode,
          showPorts:
            interactionMode !== 'delete' &&
            (hoveredNodeId === node.id ||
              draftConnection?.sourceId === node.id ||
              draftConnection?.targetId === node.id),
          isDraftSource: draftConnection?.sourceId === node.id,
          isDraftTarget: draftConnection?.targetId === node.id,
          onHoverChange: (nodeId, isHovered) => {
            setHoveredNodeId(isHovered ? nodeId : '');
          },
          onPortPointerDown: (event, nodeId) => {
            event.preventDefault();
            event.stopPropagation();

            const nodeRef = nodes.find((item) => item.id === nodeId);
            if (!nodeRef) return;

            const center = getNodeCenter(nodeRef);
            setDraftConnection({
              sourceId: nodeId,
              sourceX: center.x,
              sourceY: center.y,
              currentX: center.x,
              currentY: center.y,
              targetId: ''
            });
            setConnectionState({ active: true, sourceId: nodeId });
          }
        }
      })),
    [draftConnection, hoveredNodeId, interactionMode, nodes, setConnectionState, setDraftConnection, setHoveredNodeId]
  );

  const displayEdges = useMemo(() => {
    if (!pendingEdge) return edges;

    return [
      ...edges,
      {
        id: 'pending-edge',
        source: pendingEdge.source,
        target: pendingEdge.target,
        sourceHandle: pendingEdge.sourceHandle,
        targetHandle: pendingEdge.targetHandle,
        type: 'graphEdge',
        data: { 
          source: pendingEdge.source,
          target: pendingEdge.target,
          sourceHandle: pendingEdge.sourceHandle,
          targetHandle: pendingEdge.targetHandle,
          weight: '', 
          isPending: true 
        },
        selected: true
      }
    ];
  }, [edges, pendingEdge]);

  const draftLine = useMemo(() => {
    if (!draftConnection) return null;

    const sourceNode = nodes.find((node) => node.id === draftConnection.sourceId);
    const sourceCenter = sourceNode
      ? getNodeCenter(sourceNode)
      : { x: draftConnection.sourceX, y: draftConnection.sourceY };

    const startPoint = getCircleIntersection(
      sourceCenter.x,
      sourceCenter.y,
      draftConnection.currentX,
      draftConnection.currentY
    );

    let endPoint = {
      x: draftConnection.currentX,
      y: draftConnection.currentY
    };

    if (draftConnection.targetId) {
      const targetNode = nodes.find((node) => node.id === draftConnection.targetId);
      if (targetNode) {
        const targetCenter = getNodeCenter(targetNode);
        endPoint = getCircleIntersection(
          targetCenter.x,
          targetCenter.y,
          sourceCenter.x,
          sourceCenter.y
        );
      }
    }

    return {
      fromX: startPoint.x,
      fromY: startPoint.y,
      toX: endPoint.x,
      toY: endPoint.y
    };
  }, [draftConnection, nodes]);

  const updateDraftTarget = useCallback(
    (flowPoint) => {
      if (!draftConnection) return;

      let nearestNode = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node) => {
        if (node.id === draftConnection.sourceId) return;

        const center = getNodeCenter(node);
        const distance = Math.hypot(center.x - flowPoint.x, center.y - flowPoint.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestNode = node;
        }
      });

      const nextTargetId = nearestDistance < 84 ? nearestNode?.id ?? '' : '';
      setDraftConnection({
        ...draftConnection,
        currentX: flowPoint.x,
        currentY: flowPoint.y,
        targetId: nextTargetId
      });
    },
    [draftConnection, nodes, setDraftConnection]
  );

  useEffect(() => {
    if (!draftConnection) return undefined;

    function handlePointerMove(event) {
      const flowPoint = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      updateDraftTarget(flowPoint);
    }

    function handlePointerUp() {
      if (draftConnection.targetId && draftConnection.sourceId !== draftConnection.targetId) {
        const sourceNode = nodes.find((node) => node.id === draftConnection.sourceId);
        const targetNode = nodes.find((node) => node.id === draftConnection.targetId);

        if (!sourceNode || !targetNode) {
          setDraftConnection(null);
          setConnectionState({ active: false, sourceId: '' });
          setHoveredNodeId('');
          return;
        }

        const sourceCenter = getNodeCenter(sourceNode);
        const targetCenter = getNodeCenter(targetNode);

        setPendingEdge({
          source: draftConnection.sourceId,
          target: draftConnection.targetId,
          sourceHandle: getClosestHandleId(sourceCenter, targetCenter),
          targetHandle: getClosestHandleId(targetCenter, sourceCenter)
        });
      }

      setDraftConnection(null);
      setConnectionState({ active: false, sourceId: '' });
      setHoveredNodeId('');
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draftConnection, reactFlow, setConnectionState, setDraftConnection, setHoveredNodeId, setPendingEdge, updateDraftTarget]);

  const handleAutoArrange = useCallback(() => {
    if (!nodes.length) return;

    const simulationNodes = nodes.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y
    }));

    const simulationLinks = edges.map((edge) => ({
      source: edge.source,
      target: edge.target
    }));

    const simulation = forceSimulation(simulationNodes)
      .force('link', forceLink(simulationLinks).id((d) => d.id).distance(200))
      .force('charge', forceManyBody().strength(-1000))
      .force('x', forceX(0).strength(0.05))
      .force('y', forceY(0).strength(0.05))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    const positionsById = {};
    simulationNodes.forEach((node) => {
      positionsById[node.id] = { x: node.x, y: node.y };
    });

    setNodePositions(positionsById);
    window.requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.22, duration: 800 });
    });
  }, [edges, nodes, reactFlow, setNodePositions]);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      const nextSelection = {
        nodeIds: selectedNodes.map((node) => node.id),
        edgeIds: selectedEdges.map((edge) => edge.id)
      };

      if (
        hasSameItems(selection.nodeIds, nextSelection.nodeIds) &&
        hasSameItems(selection.edgeIds, nextSelection.edgeIds)
      ) {
        return;
      }

      setSelection(nextSelection);
    },
    [selection, setSelection]
  );

  useEffect(() => {
    function handleDeleteSelection(event) {
      if (event.key === 'Escape') {
        setConnectionState({ active: false, sourceId: '' });
        setDraftConnection(null);
        setPendingEdge(null);
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      // Don't delete if we are in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;

      if (selection.nodeIds.length) removeNodes(selection.nodeIds);
      if (selection.edgeIds.length) selection.edgeIds.forEach((id) => removeEdge(id));
    }

    window.addEventListener('keydown', handleDeleteSelection);
    return () => window.removeEventListener('keydown', handleDeleteSelection);
  }, [removeEdge, removeNodes, selection, setConnectionState, setDraftConnection, setPendingEdge]);

  return (
    <div ref={wrapperRef} className="graph-editor-shell">
      <ReactFlow
        nodes={editorNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        deleteKeyCode={null}
        onNodeClick={(_, node) => {
          if (interactionMode === 'delete') removeNodes([node.id]);
        }}
        onEdgeClick={(_, edge) => {
          if (interactionMode === 'delete') removeEdge(edge.id);
        }}
        onNodeDragStop={(_, node) => moveNode(node.id, node.position)}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => setSelection({ nodeIds: [], edgeIds: [] })}
        fitView
        connectionLineComponent={ConnectionLine}
        snapToGrid={false}
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
        panOnScroll
        zoomOnDoubleClick={false}
        zoomActivationKeyCode={['Meta', 'Control']}
        selectionOnDrag
        multiSelectionKeyCode={['Meta', 'Control']}
        panOnDrag={[2]}
        selectionMode="partial"
        nodesDraggable={interactionMode !== 'connect'}
        elementsSelectable={interactionMode !== 'delete'}
        nodesConnectable={false}
        connectOnClick={false}
        connectionMode="loose"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={72} size={1} color="#1e293b" variant={BackgroundVariant.Lines} />
        <Background gap={18} size={1} color="#0f172a" variant={BackgroundVariant.Dots} />
        <MiniMap
          pannable
          zoomable
          className="graph-minimap"
        />
        <Controls className="graph-controls" showInteractive={false} />
      </ReactFlow>

      {draftLine && (
        <svg
          className="draft-connection-overlay"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <ConnectionLine {...draftLine} />
        </svg>
      )}
    </div>
  );
}
