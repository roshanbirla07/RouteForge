import { ReactFlowProvider } from '@xyflow/react';
import GraphEditor from './components/GraphEditor';
import { useRouteAnimator } from './hooks/useRouteAnimator';
import { forgeRoute } from './api/routeApi';
import { buildRouteRequest, mapRouteResponse, useGraphStore } from './store/useGraphStore';

function GraphWorkspace() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const sourceId = useGraphStore((state) => state.sourceId);
  const destinationId = useGraphStore((state) => state.destinationId);
  const algorithm = useGraphStore((state) => state.algorithm);
  const setLoading = useGraphStore((state) => state.setLoading);
  const setError = useGraphStore((state) => state.setError);
  const setRouteResult = useGraphStore((state) => state.setRouteResult);

  useRouteAnimator();

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
      setRouteResult(mapRouteResponse(response, vertexIdByIndex));
    } catch (requestError) {
      setRouteResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(139,92,246,0.12),transparent_22%),linear-gradient(160deg,#020617_0%,#081120_50%,#02030a_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col px-5 py-5 lg:px-6 lg:py-6">
        <header className="mb-5 rounded-[32px] border border-white/10 bg-slate-950/55 px-7 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-300/80">RouteForge Premium Graph Editor</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white lg:text-6xl">
                Build routes like a modern workflow canvas.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 lg:text-base">
                Drag graph nodes, connect from glowing handles, edit edge weights inline, and animate
                Dijkstra or A* traversal directly on a polished node-editor surface.
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/8 px-5 py-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
              <p className="font-medium">Tips</p>
              <p className="mt-1 text-cyan-50/80">
                Drag from the glowing <span className="font-semibold">+</span> handle to create edges.
                Use right-mouse drag to pan and mouse wheel to zoom.
              </p>
            </div>
          </div>
        </header>

        <main className="relative min-h-[760px] flex-1 overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/45 shadow-[0_32px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <ReactFlowProvider>
            <GraphEditor onForgeRoute={handleForgeRoute} />
          </ReactFlowProvider>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <GraphWorkspace />;
}
