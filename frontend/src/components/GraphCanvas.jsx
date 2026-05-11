import { useEffect, useRef, useState } from 'react';

const NODE_RADIUS = 24;

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPointerPosition(svg, event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function buildPathEdgeSet(path) {
  const segments = new Set();

  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    segments.add(`${from}-${to}`);
    segments.add(`${to}-${from}`);
  }

  return segments;
}

export default function GraphCanvas({
  nodes,
  edges,
  highlightedPath,
  onAddNode,
  onCreateEdge
}) {
  const svgRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const highlightedEdges = buildPathEdgeSet(highlightedPath);

  useEffect(() => {
    function handlePointerMove(event) {
      if (!dragState || !svgRef.current) {
        return;
      }

      setDragState((currentState) => {
        if (!currentState || !svgRef.current) {
          return currentState;
        }

        return {
          ...currentState,
          currentPoint: getPointerPosition(svgRef.current, event)
        };
      });
    }

    function handlePointerUp(event) {
      if (!dragState || !svgRef.current) {
        return;
      }

      const currentPoint = getPointerPosition(svgRef.current, event);
      const targetNode = nodes.find((node) => getDistance(node, currentPoint) <= NODE_RADIUS);

      if (targetNode && targetNode.id !== dragState.sourceId) {
        onCreateEdge(dragState.sourceId, targetNode.id);
      }

      setDragState(null);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, nodes, onCreateEdge]);

  function handleCanvasClick(event) {
    if (!svgRef.current || dragState) {
      return;
    }

    if (event.target.closest('[data-node="true"]')) {
      return;
    }

    onAddNode(getPointerPosition(svgRef.current, event));
  }

  function startEdgeDrag(node, event) {
    event.stopPropagation();
    setDragState({
      sourceId: node.id,
      startPoint: { x: node.x, y: node.y },
      currentPoint: { x: node.x, y: node.y }
    });
  }

  return (
    <div className="canvas-shell">
      <div className="canvas-header">
        <div>
          <h2>Canvas Graph Builder</h2>
          <p>Click empty space to add nodes. Drag from one node to another to forge weighted edges.</p>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="graph-canvas"
        viewBox="0 0 900 560"
        onClick={handleCanvasClick}
      >
        <rect x="0" y="0" width="900" height="560" rx="28" className="canvas-backdrop" />

        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);

          if (!from || !to) {
            return null;
          }

          const isHighlighted = highlightedEdges.has(`${edge.from}-${edge.to}`);
          const labelX = (from.x + to.x) / 2;
          const labelY = (from.y + to.y) / 2;

          return (
            <g
              key={edge.id}
              className={`edge ${isHighlighted ? 'edge-highlighted' : ''}`}
            >
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle">
                {edge.weight}
              </text>
            </g>
          );
        })}

        {dragState ? (
          <line
            className="edge edge-draft"
            x1={dragState.startPoint.x}
            y1={dragState.startPoint.y}
            x2={dragState.currentPoint.x}
            y2={dragState.currentPoint.y}
          />
        ) : null}

        {nodes.map((node) => {
          const isHighlighted = highlightedPath.includes(node.id);

          return (
            <g
              key={node.id}
              className={`node ${isHighlighted ? 'node-highlighted' : ''}`}
              data-node="true"
              onPointerDown={(event) => startEdgeDrag(node, event)}
            >
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS} />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle">
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
