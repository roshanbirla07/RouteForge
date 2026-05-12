export default function InspectorPanel({
  nodeOptions,
  sourceId,
  destinationId,
  onSourceChange,
  onDestinationChange,
  routeResult,
  error,
  selection,
  nodeCount,
  edgeCount
}) {
  return (
    <aside className="pointer-events-auto absolute right-6 top-6 z-20 w-[320px] rounded-[28px] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Route Control</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">Forge the route graph</h2>
        <p className="mt-2 text-sm text-slate-400">
          Drag nodes, connect from visible handles, edit weights inline, then run the solver.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Source</span>
          <select
            value={sourceId}
            onChange={(event) => onSourceChange(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
          >
            <option value="">Select source node</option>
            {nodeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Destination</span>
          <select
            value={destinationId}
            onChange={(event) => onDestinationChange(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
          >
            <option value="">Select destination node</option>
            {nodeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Graph</p>
          <p className="mt-2 text-lg font-semibold text-slate-50">{nodeCount} nodes</p>
          <p className="text-sm text-slate-400">{edgeCount} edges</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Selection</p>
          <p className="mt-2 text-lg font-semibold text-slate-50">
            {selection.nodeIds.length + selection.edgeIds.length}
          </p>
          <p className="text-sm text-slate-400">active items</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Route Output</p>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <div>
            <span className="text-slate-500">Path</span>
            <p className="mt-1 font-medium text-slate-100">
              {routeResult?.reachable
                ? routeResult.pathNodeIds.map((nodeId) => nodeId.replace('node-', 'Node ')).join(' -> ')
                : 'No route forged yet'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500">Distance</span>
              <p className="mt-1 font-medium text-slate-100">
                {routeResult?.reachable ? routeResult.distance : '--'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Visited</span>
              <p className="mt-1 font-medium text-slate-100">
                {routeResult?.visitedNodeIds?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </aside>
  );
}
