import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useUIStore } from '../store/useUIStore';
import { useGraphStore } from '../store/useGraphStore';
import { 
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY
} from 'd3-force';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Zap, 
  Maximize2, 
  Layers,
  MousePointer2
} from 'lucide-react';

export default function Toolbar({ onForgeRoute }) {
  const reactFlow = useReactFlow();
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const addNode = useGraphStore((state) => state.addNode);
  const clearGraph = useGraphStore((state) => state.clearGraph);
  const setNodePositions = useGraphStore((state) => state.setNodePositions);
  
  const interactionMode = useUIStore((state) => state.interactionMode);
  const setInteractionMode = useUIStore((state) => state.setInteractionMode);
  const loading = useUIStore((state) => state.loading);

  const handleAddNode = useCallback(() => {
    // We'll add the node to the center of the viewport
    const viewport = reactFlow.getViewport();
    const center = reactFlow.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    addNode(center);
  }, [addNode, reactFlow]);

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
      reactFlow.fitView({ padding: 0.2, duration: 800 });
    });
  }, [edges, nodes, reactFlow, setNodePositions]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'connect', icon: Layers, label: 'Connect' },
    { id: 'delete', icon: Trash2, label: 'Delete' },
  ];

  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-1 py-1 bg-slate-100 rounded-lg mr-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setInteractionMode(tool.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${interactionMode === tool.id 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
              `}
              title={tool.label}
            >
              <tool.icon size={16} strokeWidth={interactionMode === tool.id ? 2.5 : 2} />
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleAddNode}
          className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          <span>Add Node</span>
        </button>

        <button
          onClick={handleAutoArrange}
          className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
        >
          <Maximize2 size={18} />
          <span>Auto Layout</span>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <button
          onClick={clearGraph}
          className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
        >
          <RotateCcw size={18} />
          <span>Clear</span>
        </button>
      </div>

      <button
        onClick={onForgeRoute}
        disabled={loading}
        className={`
          flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 
          hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        `}
      >
        <Zap size={18} fill="currentColor" />
        <span>FORGE ROUTE</span>
      </button>
    </div>
  );
}
