import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';

export default function GraphEdge({
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
  const interactionMode = useGraphStore((state) => state.interactionMode);
  const removeEdge = useGraphStore((state) => state.removeEdge);
  const updateEdgeWeight = useGraphStore((state) => state.updateEdgeWeight);
  const routeAnimation = useGraphStore((state) => state.routeAnimation);
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(data?.weight ?? 1));
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.24
  });
  const isPathEdge = routeAnimation.pathEdgeIds.includes(id);
  const isEnergized = routeAnimation.energizedEdgeIds?.includes(id);

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

  function handleEdgeActivation(event) {
    event.stopPropagation();

    if (interactionMode === 'delete') {
      removeEdge(id);
      return;
    }

    setIsEditing(true);
  }

  return (
    <>
      <motion.path
        d={edgePath}
        fill="none"
        className={[
          'route-edge-glow',
          selected ? 'route-edge-selected' : '',
          isPathEdge ? 'route-edge-active' : '',
          isEnergized ? 'route-edge-energized' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: isPathEdge ? [0.4, 1, 0.4] : 0.74 }}
        transition={{ duration: 1.25, repeat: isPathEdge ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.path
        d={edgePath}
        fill="none"
        className={isEnergized ? 'route-edge-flow' : 'route-edge-flow route-edge-flow-hidden'}
        strokeLinecap="round"
        initial={false}
        animate={{ strokeDashoffset: [0, -48], opacity: isEnergized ? [0.4, 1, 0.4] : 0 }}
        transition={{ duration: 1, repeat: isEnergized ? Infinity : 0, ease: 'linear' }}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className={[
          'route-edge-core',
          selected ? 'route-edge-selected' : '',
          isPathEdge ? 'route-edge-active' : '',
          isEnergized ? 'route-edge-energized' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth="26"
        className="cursor-pointer"
        onClick={handleEdgeActivation}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
          }}
        >
          {isEditing && interactionMode !== 'delete' ? (
            <input
              autoFocus
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onBlur={commitWeight}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitWeight();
                }

                if (event.key === 'Escape') {
                  setDraftValue(String(data?.weight ?? 1));
                  setIsEditing(false);
                }
              }}
              className="w-16 rounded-full border border-cyan-300/40 bg-slate-950/95 px-3 py-1.5 text-center text-xs font-semibold text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.25)] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={handleEdgeActivation}
              className={[
                'rounded-full border border-white/10 bg-slate-950/92 px-2.5 py-1 text-[11px] font-semibold text-slate-100 shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-all duration-200',
                isPathEdge ? 'border-cyan-300/50 text-cyan-100 shadow-[0_0_26px_rgba(56,189,248,0.24)]' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {data?.weight ?? 1}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
