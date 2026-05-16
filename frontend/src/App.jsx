import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphEditor from './components/GraphEditor';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { forgeRoute } from './api/routeApi';
import { useGraphStore, buildRouteRequest } from './store/useGraphStore';
import { useAlgorithmStore } from './store/useAlgorithmStore';
import { useUIStore } from './store/useUIStore';
import { usePlaybackStore } from './store/usePlaybackStore';

function GraphWorkspace() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  
  const sourceId = useAlgorithmStore((state) => state.sourceId);
  const destinationId = useAlgorithmStore((state) => state.destinationId);
  const algorithm = useAlgorithmStore((state) => state.algorithm);

  const setLoading = useUIStore((state) => state.setLoading);
  const setError = useUIStore((state) => state.setError);

  const setRouteResult = usePlaybackStore((state) => state.setRouteResult);

  async function handleForgeRoute() {
    if (nodes.length < 2) {
      setError('Add at least two nodes before forging a route.');
      return;
    }

    if (!edges.length) {
      setError('Create at least one edge before forging a route.');
      return;
    }

    if (!sourceId || !destinationId) {
      setError('Select both a source and a destination node.');
      return;
    }

    const { payload, vertexIdByIndex } = buildRouteRequest({
      nodes,
      edges,
      sourceId,
      destinationId,
      algorithm
    });

    setLoading(true);
    setError('');

    try {
      const response = await forgeRoute(payload);
      setRouteResult(response, vertexIdByIndex, edges);
    } catch (requestError) {
      setRouteResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <ReactFlowProvider>
        <Toolbar onForgeRoute={handleForgeRoute} />
        <div className="flex flex-1 overflow-hidden">
          <GraphEditor />
          <Sidebar />
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export default function App() {
  return <GraphWorkspace />;
}
