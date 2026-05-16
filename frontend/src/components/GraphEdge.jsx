import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { memo, useState, useEffect, useRef } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useGraphStore } from '../store/useGraphStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { Pencil, X } from 'lucide-react';

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
  const setPendingEdge = useUIStore((state) => state.setPendingEdge);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const updateEdgeWeight = useGraphStore((state) => state.updateEdgeWeight);
  const createOrUpdateEdge = useGraphStore((state) => state.createOrUpdateEdge);
  
  const pathEdgeIds = usePlaybackStore((state) => state.pathEdgeIds);
  const energizedEdgeIds = usePlaybackStore((state) => state.energizedEdgeIds);

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(data?.weight ?? 1));
  const isPending = Boolean(data?.isPending);
  const cancelEditRef = useRef(false);

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

  useEffect(() => {
    if (isPending) {
      setIsEditing(true);
    }
  }, [isPending]);

  function commitWeight() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }

    const parsedWeight = Number.parseInt(draftValue, 10);
    const nextWeight = Number.isInteger(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1;

    if (isPending) {
      createOrUpdateEdge(data.source, data.target, nextWeight, data.sourceHandle, data.targetHandle);
      setPendingEdge(null);
      setDraftValue(String(nextWeight));
    } else if (Number.isInteger(parsedWeight) && parsedWeight > 0) {
      updateEdgeWeight(id, parsedWeight);
    } else {
      setDraftValue(String(data?.weight ?? 1));
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
  }

  function handleEdgeClick(event) {
    event.stopPropagation();
    if (isPending) return;
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
          stroke: isPending ? '#38bdf8' : isPathEdge ? '#facc15' : selected ? '#e2e8f0' : '#7c8aa5',
          strokeWidth: isPending ? 3.5 : isPathEdge || selected ? 3 : 2.2,
          transition: 'stroke 0.2s, stroke-width 0.2s, filter 0.2s',
          filter: isPending || selected ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.35))' : 'none'
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
            <div className="edge-label-editor">
              <input
                autoFocus
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onBlur={commitWeight}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitWeight();
                  if (e.key === 'Escape') {
                    cancelEditRef.current = true;
                    setDraftValue(String(data?.weight ?? 1));
                    setIsEditing(false);
                    if (isPending) {
                      setPendingEdge(null);
                    }
                  }
                }}
                className="edge-weight-input"
              />
            </div>
          ) : (
            <div className="edge-label-cluster">
              <div
                onClick={handleEdgeClick}
                className={`edge-weight-pill ${isPathEdge ? 'is-path' : ''} ${selected ? 'is-selected' : ''}`}
              >
                {data?.weight ?? 1}
              </div>
              {selected && !isPending && interactionMode !== 'delete' && (
                <div className="edge-actions">
                  <button
                    type="button"
                    className="edge-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    className="edge-action edge-action-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeEdge(id);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(GraphEdge);
