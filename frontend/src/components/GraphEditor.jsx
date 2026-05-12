import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow
} from '@xyflow/react';
import dagre from 'dagre';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import ConnectionLine from './ConnectionLine';
import GraphEdge from './GraphEdge';
import GraphNode from './GraphNode';
import InspectorPanel from './InspectorPanel';
import Toolbar from './Toolbar';

const nodeTypes = {
  graphNode: GraphNode
};

const edgeTypes = {
  graphEdge: GraphEdge
};
const LAYOUT_NODE_WIDTH = 92;
const LAYOUT_NODE_HEIGHT = 92;

function hasSameItems(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

export default function GraphEditor({ onForgeRoute }) {
  const wrapperRef = useRef(null);
  const reactFlow = useReactFlow();
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const sourceId = useGraphStore((state) => state.sourceId);
  const destinationId = useGraphStore((state) => state.destinationId);
  const algorithm = useGraphStore((state) => state.algorithm);
  const interactionMode = useGraphStore((state) => state.interactionMode);
  const loading = useGraphStore((state) => state.loading);
  const error = useGraphStore((state) => state.error);
  const selection = useGraphStore((state) => state.selection);
  const routeResult = useGraphStore((state) => state.routeResult);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const addNode = useGraphStore((state) => state.addNode);
  const moveNode = useGraphStore((state) => state.moveNode);
  const createOrUpdateEdge = useGraphStore((state) => state.createOrUpdateEdge);
  const removeNodes = useGraphStore((state) => state.removeNodes);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const clearGraph = useGraphStore((state) => state.clearGraph);
  const setNodePositions = useGraphStore((state) => state.setNodePositions);
  const setInteractionMode = useGraphStore((state) => state.setInteractionMode);
  const setSourceId = useGraphStore((state) => state.setSourceId);
  const setDestinationId = useGraphStore((state) => state.setDestinationId);
  const setAlgorithm = useGraphStore((state) => state.setAlgorithm);
  const setSelection = useGraphStore((state) => state.setSelection);
  const setConnectionState = useGraphStore((state) => state.setConnectionState);

  const nodeOptions = useMemo(
    () =>
      nodes
        .slice()
        .sort((left, right) => (left.data?.nodeNumber ?? 0) - (right.data?.nodeNumber ?? 0))
        .map((node) => ({
          value: node.id,
          label: node.data?.label ?? node.id
        })),
    [nodes]
  );

  const handleAddNode = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }

    const bounds = wrapperRef.current.getBoundingClientRect();
    const centerPoint = reactFlow.screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2
    });

    addNode(centerPoint);
  }, [addNode, reactFlow]);

  const handleConnect = useCallback(
    ({ source, target }) => {
      createOrUpdateEdge(source, target, 1);
      setConnectionState({
        active: false,
        sourceId: ''
      });
    },
    [createOrUpdateEdge, setConnectionState]
  );

  const handleAutoArrange = useCallback(() => {
    if (!nodes.length) {
      return;
    }

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: 'LR',
      ranksep: 120,
      nodesep: 90,
      marginx: 40,
      marginy: 40
    });

    nodes.forEach((node) => {
      graph.setNode(node.id, {
        width: LAYOUT_NODE_WIDTH,
        height: LAYOUT_NODE_HEIGHT
      });
    });

    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph);

    const positionsById = {};
    nodes.forEach((node) => {
      const positionedNode = graph.node(node.id);

      positionsById[node.id] = {
        x: positionedNode.x - LAYOUT_NODE_WIDTH / 2,
        y: positionedNode.y - LAYOUT_NODE_HEIGHT / 2
      };
    });

    setNodePositions(positionsById);
    window.requestAnimationFrame(() => {
      reactFlow.fitView({
        padding: 0.22,
        duration: 600
      });
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
    [selection.edgeIds, selection.nodeIds, setSelection]
  );

  useEffect(() => {
    function handleDeleteSelection(event) {
      if (event.key === 'Escape') {
        setConnectionState({
          active: false,
          sourceId: ''
        });
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      if (selection.nodeIds.length) {
        removeNodes(selection.nodeIds);
      }

      if (selection.edgeIds.length) {
        selection.edgeIds.forEach((edgeId) => removeEdge(edgeId));
      }
    }

    function handleContextMenu() {
      setConnectionState({
        active: false,
        sourceId: ''
      });
    }

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleDeleteSelection);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleDeleteSelection);
    };
  }, [removeEdge, removeNodes, selection.edgeIds, selection.nodeIds, setConnectionState]);

  return (
    <div ref={wrapperRef} className="route-editor-shell">
      <Toolbar
        onAddNode={handleAddNode}
        onAutoArrange={handleAutoArrange}
        onClearGraph={clearGraph}
        onForgeRoute={onForgeRoute}
        onModeChange={setInteractionMode}
        interactionMode={interactionMode}
        algorithm={algorithm}
        onAlgorithmChange={setAlgorithm}
        loading={loading}
      />

      <InspectorPanel
        nodeOptions={nodeOptions}
        sourceId={sourceId}
        destinationId={destinationId}
        onSourceChange={setSourceId}
        onDestinationChange={setDestinationId}
        routeResult={routeResult}
        error={error}
        selection={selection}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

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
          if (interactionMode === 'delete') {
            removeNodes([node.id]);
          }
        }}
        onEdgeClick={(_, edge) => {
          if (interactionMode === 'delete') {
            removeEdge(edge.id);
          }
        }}
        onNodeDragStop={(_, node) => moveNode(node.id, node.position)}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() =>
          setSelection({
            nodeIds: [],
            edgeIds: []
          })
        }
        fitView
        connectionLineComponent={ConnectionLine}
        snapToGrid
        snapGrid={[24, 24]}
        minZoom={0.35}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.95 }}
        selectionOnDrag
        multiSelectionKeyCode={['Meta', 'Control']}
        panOnDrag={[2]}
        selectionMode="partial"
        nodesDraggable={interactionMode !== 'connect'}
        elementsSelectable={interactionMode !== 'delete'}
        nodesConnectable={interactionMode !== 'delete'}
        connectOnClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background id="primary-grid" gap={24} size={1} color="rgba(125, 145, 180, 0.16)" variant={BackgroundVariant.Lines} />
        <Background id="secondary-grid" gap={120} size={1.2} color="rgba(56, 189, 248, 0.12)" variant={BackgroundVariant.Lines} />
        <MiniMap
          pannable
          zoomable
          className="!bottom-5 !left-5 !h-[120px] !w-[180px] !overflow-hidden !rounded-3xl !border !border-white/10 !bg-slate-950/80 !shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          nodeColor={(node) => (node.id === sourceId ? '#22c55e' : node.id === destinationId ? '#fb7185' : '#38bdf8')}
          maskColor="rgba(2, 6, 23, 0.55)"
        />
        <Controls className="!bottom-5 !right-5 !overflow-hidden !rounded-3xl !border !border-white/10 !bg-slate-950/80 !shadow-[0_24px_70px_rgba(0,0,0,0.35)]" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
