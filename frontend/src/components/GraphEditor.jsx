import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow
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
  
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const addNode = useGraphStore((state) => state.addNode);
  const moveNode = useGraphStore((state) => state.moveNode);
  const createOrUpdateEdge = useGraphStore((state) => state.createOrUpdateEdge);
  const removeNodes = useGraphStore((state) => state.removeNodes);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const setNodePositions = useGraphStore((state) => state.setNodePositions);

  const interactionMode = useUIStore((state) => state.interactionMode);
  const selection = useUIStore((state) => state.selection);
  const setSelection = useUIStore((state) => state.setSelection);
  const setConnectionState = useUIStore((state) => state.setConnectionState);
  const pendingEdge = useUIStore((state) => state.pendingEdge);
  const setPendingEdge = useUIStore((state) => state.setPendingEdge);

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
          weight: '', 
          isPending: true 
        },
        selected: true
      }
    ];
  }, [edges, pendingEdge]);

  const handleConnect = useCallback(
    (params) => {
      // Guard: if already creating an edge, ignore
      if (pendingEdge) return;

      // Validate source and target nodes exist in the current graph
      const sourceExists = nodes.some((n) => n.id === params.source);
      const targetExists = nodes.some((n) => n.id === params.target);
      
      if (!sourceExists || !targetExists) return;

      // Set the transient pending edge state instead of committing to graph store
      setPendingEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle
      });

      setConnectionState({
        active: false,
        sourceId: ''
      });
    },
    [nodes, pendingEdge, setConnectionState, setPendingEdge]
  );

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
  }, [removeEdge, removeNodes, selection, setConnectionState]);

  return (
    <div ref={wrapperRef} className="flex-1 relative bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectStart={(_, params) =>
          setConnectionState({
            active: true,
            sourceId: params.nodeId ?? ''
          })
        }
        onConnectEnd={() =>
          setConnectionState({
            active: false,
            sourceId: ''
          })
        }
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
        selectionOnDrag
        multiSelectionKeyCode={['Meta', 'Control']}
        panOnDrag={[2]}
        selectionMode="partial"
        nodesDraggable={interactionMode !== 'connect'}
        elementsSelectable={interactionMode !== 'delete'}
        nodesConnectable={interactionMode !== 'delete'}
        connectOnClick={false}
        connectionMode="loose"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#e2e8f0" variant={BackgroundVariant.Lines} />
        <MiniMap
          pannable
          zoomable
          className="!bottom-4 !right-4 !border-slate-200 !bg-white/80 !shadow-sm"
        />
        <Controls className="!bottom-4 !left-4 !border-slate-200 !bg-white/80 !shadow-sm" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
