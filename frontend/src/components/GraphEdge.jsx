import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { memo, useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useGraphStore } from '../store/useGraphStore';
import { usePlaybackStore } from '../store/usePlaybackStore';

const NODE_RADIUS = 46;

// Helper to calculate intersection point of a line with a circle
function getIntersection(aX, aY, bX, bY, radius) {
  const dx = bX - aX;
  const dy = bY - aY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return { x: aX, y: aY };

  return {
    x: aX + (dx * radius) / distance,
    y: aY + (dy * radius) / distance
  };
}

function GraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected
}) {
  const interactionMode = useUIStore((state) => state.interactionMode);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const updateEdgeWeight = useGraphStore((state) => state.updateEdgeWeight);
  
  const pathEdgeIds = usePlaybackStore((state) => state.pathEdgeIds);
  const energizedEdgeIds = usePlaybackStore((state) => state.energizedEdgeIds);

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(data?.weight ?? 1));

  const isPathEdge = pathEdgeIds.includes(id);
  const isEnergized = energizedEdgeIds.includes(id);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.15
  });

  useEffect(() => {
    setDraftValue(String(data?.weight ?? 1));
  }, [data?.weight]);

  function commitWeight() {
    const parsedWeight = Number.parseInt(draftValue, 10);
    if (Number.isInteger(parsedWeight) && parsedWeight > 0) {
      updateEdgeWeight(id, parsedWeight);
    } else {
      setDraftValue(String(data?.weight ?? 1));
    }
    setIsEditing(false);
  }

  function handleEdgeClick(event) {
    event.stopPropagation();
    if (interactionMode === 'delete') {
      removeEdge(id);
      return;
    }
    setIsEditing(true);
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className={`route-edge-core ${selected ? 'selected' : ''} ${isPathEdge ? 'route-edge-active' : ''}`}
        style={{
          stroke: isPathEdge ? '#eab308' : selected ? '#3b82f6' : '#94a3b8',
          strokeWidth: isPathEdge || selected ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
      />
      
      {isEnergized && (
        <path
          d={edgePath}
          fill="none"
          className="edge-active"
          stroke="#3b82f6"
        />
      )}

      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        className="cursor-pointer"
        onClick={handleEdgeClick}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all'
          }}
        >
          {isEditing && interactionMode !== 'delete' ? (
            <input
              autoFocus
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onBlur={commitWeight}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitWeight();
                if (e.key === 'Escape') {
                  setDraftValue(String(data?.weight ?? 1));
                  setIsEditing(false);
                }
              }}
              className="w-12 h-7 bg-white border-2 border-blue-500 rounded shadow-lg text-center text-xs font-bold outline-none"
            />
          ) : (
            <div
              onClick={handleEdgeClick}
              className={`
                px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold shadow-sm cursor-pointer hover:border-slate-400 transition-colors
                ${isPathEdge ? 'border-yellow-400 text-yellow-700 bg-yellow-50' : 'text-slate-600'}
              `}
            >
              {data?.weight ?? 1}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(GraphEdge);
