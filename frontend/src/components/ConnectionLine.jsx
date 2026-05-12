import { getBezierPath } from '@xyflow/react';
import { motion } from 'framer-motion';

export default function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition
}) {
  const [connectionPath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    curvature: 0.24
  });

  return (
    <g>
      <defs>
        <marker
          id="route-preview-arrow"
          markerWidth="18"
          markerHeight="18"
          refX="14"
          refY="9"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 18 9 L 0 18 z" fill="#67e8f9" />
        </marker>
      </defs>

      <motion.path
        d={connectionPath}
        fill="none"
        stroke="rgba(103, 232, 249, 0.28)"
        strokeWidth="12"
        strokeLinecap="round"
        initial={false}
        animate={{ opacity: [0.24, 0.6, 0.24] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d={connectionPath}
        fill="none"
        stroke="#67e8f9"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="12 8"
        markerEnd="url(#route-preview-arrow)"
        initial={false}
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </g>
  );
}
