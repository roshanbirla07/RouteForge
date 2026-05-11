import { useMemo, useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import { forgeRoute } from './api/routeApi';

function createEdgeId(from, to) {
  return [Math.min(from, to), Math.max(from, to)].join('-');
}

function formatPath(path) {
  return Array.isArray(path) && path.length ? path.join(' -> ') : 'No path returned';
}

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nodeOptions = useMemo(
    () => nodes.map((node) => ({ value: node.id, label: `Node ${node.id}` })),
    [nodes]
  );

  function handleAddNode(position) {
    setNodes((currentNodes) => {
      const nextId = currentNodes.length;
      return [...currentNodes, { id: nextId, ...position }];
    });
    setRouteResult(null);
    setError('');
  }

  function handleCreateEdge(from, to) {
    const weightInput = window.prompt(`Set edge weight for ${from} -> ${to}`, '1');

    if (weightInput === null) {
      return;
    }

    const parsedWeight = Number.parseInt(weightInput, 10);

    if (!Number.isInteger(parsedWeight) || parsedWeight <= 0) {
      window.alert('Weight must be a positive integer.');
      return;
    }

    const edgeId = createEdgeId(from, to);

    setEdges((currentEdges) => {
      const existingIndex = currentEdges.findIndex((edge) => edge.id === edgeId);
      const nextEdge = { id: edgeId, from, to, weight: parsedWeight };

      if (existingIndex >= 0) {
        const updatedEdges = [...currentEdges];
        updatedEdges[existingIndex] = nextEdge;
        return updatedEdges;
      }

      return [...currentEdges, nextEdge];
    });

    setRouteResult(null);
    setError('');
  }

  async function handleForgeRoute() {
    if (nodes.length < 2) {
      setError('Add at least two nodes before forging a route.');
      return;
    }

    if (!edges.length) {
      setError('Create at least one edge before forging a route.');
      return;
    }

    if (source === '' || destination === '') {
      setError('Select both a source and a destination node.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await forgeRoute({
        vertices: nodes.length,
        edges: edges.map((edge) => [edge.from, edge.to, edge.weight]),
        source: Number(source),
        destination: Number(destination),
        algorithm,
        undirected: true
      });

      setRouteResult(response);
    } catch (requestError) {
      setRouteResult(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">RouteForge</span>
          <h1>Sketch a graph. Forge the fastest route.</h1>
          <p>
            Build a weighted network directly on the canvas, switch between Dijkstra and A*,
            then send the graph to the local planner.
          </p>
        </div>
      </section>

      <main className="workspace">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          highlightedPath={routeResult?.path ?? []}
          onAddNode={handleAddNode}
          onCreateEdge={handleCreateEdge}
        />

        <aside className="control-panel">
          <div className="panel-card">
            <h2>Controls</h2>

            <label>
              <span>Source node</span>
              <select value={source} onChange={(event) => setSource(event.target.value)}>
                <option value="">Select source</option>
                {nodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Destination node</span>
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                <option value="">Select destination</option>
                {nodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="algorithm-toggle" role="radiogroup" aria-label="Routing algorithm">
              <button
                type="button"
                className={algorithm === 'dijkstra' ? 'active' : ''}
                onClick={() => setAlgorithm('dijkstra')}
              >
                Dijkstra
              </button>
              <button
                type="button"
                className={algorithm === 'astar' ? 'active' : ''}
                onClick={() => setAlgorithm('astar')}
              >
                A*
              </button>
            </div>

            <button type="button" className="forge-button" onClick={handleForgeRoute} disabled={loading}>
              {loading ? 'Forging...' : 'Forge Route'}
            </button>

            {error ? <p className="status error">{error}</p> : null}
          </div>

          <div className="panel-card">
            <h2>Output</h2>
            <div className="result-grid">
              <div>
                <span className="result-label">Path</span>
                <strong>{routeResult?.reachable ? formatPath(routeResult.path) : 'Unreachable'}</strong>
              </div>
              <div>
                <span className="result-label">Distance</span>
                <strong>{routeResult?.reachable ? routeResult.distance : '--'}</strong>
              </div>
              <div>
                <span className="result-label">Nodes visited</span>
                <strong>
                  {Array.isArray(routeResult?.nodesVisited)
                    ? routeResult.nodesVisited.join(', ')
                    : 'Not provided by backend'}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel-card compact">
            <h2>Graph Snapshot</h2>
            <p>{nodes.length} nodes</p>
            <p>{edges.length} edges</p>
            <p>Mode: undirected</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
