import React from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { useAlgorithmStore } from '../store/useAlgorithmStore';
import { useUIStore } from '../store/useUIStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { Play, Pause, SkipBack, SkipForward, Info, AlertCircle } from 'lucide-react';

export default function Sidebar() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  
  const sourceId = useAlgorithmStore((state) => state.sourceId);
  const destinationId = useAlgorithmStore((state) => state.destinationId);
  const algorithm = useAlgorithmStore((state) => state.algorithm);
  const setSourceId = useAlgorithmStore((state) => state.setSourceId);
  const setDestinationId = useAlgorithmStore((state) => state.setDestinationId);
  const setAlgorithm = useAlgorithmStore((state) => state.setAlgorithm);

  const error = useUIStore((state) => state.error);
  const loading = useUIStore((state) => state.loading);

  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const stepForward = usePlaybackStore((state) => state.stepForward);
  const stepBackward = usePlaybackStore((state) => state.stepBackward);
  const playbackSpeed = usePlaybackStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = usePlaybackStore((state) => state.setPlaybackSpeed);
  const routeResult = usePlaybackStore((state) => state.routeResult);

  const nodeOptions = nodes
    .slice()
    .sort((a, b) => (a.data?.nodeNumber ?? 0) - (b.data?.nodeNumber ?? 0))
    .map((node) => ({
      id: node.id,
      label: `Node ${node.data?.nodeNumber}`
    }));

  return (
    <aside className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source Node</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select source...</option>
              {nodeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination Node</label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">Select destination...</option>
              {nodeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="dijkstra">Dijkstra's Algorithm</option>
              <option value="astar">A* Search</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Playback</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={stepBackward}
              disabled={!routeResult}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-md disabled:opacity-30"
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={isPlaying ? pause : play}
              disabled={!routeResult}
              className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-30"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <button
              onClick={stepForward}
              disabled={!routeResult}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-md disabled:opacity-30"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium text-slate-500">Playback Speed</label>
              <span className="text-xs font-bold text-slate-700">{playbackSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Stats & Info</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex gap-2 text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Nodes</span>
            <span className="font-mono font-bold text-slate-900">{nodes.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Edges</span>
            <span className="font-mono font-bold text-slate-900">{edges.length}</span>
          </div>
          {routeResult && (
            <>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between text-sm text-blue-600 font-medium">
                <span>Distance</span>
                <span className="font-mono font-bold">{routeResult.distance}</span>
              </div>
            </>
          )}
        </div>

        {!routeResult && !loading && (
          <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-lg flex gap-3 text-slate-500">
            <Info size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Configure source and destination nodes, then click <strong>Forge Route</strong> in the toolbar to begin.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
