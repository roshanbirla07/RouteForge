import React from 'react';
import { getBezierPath } from '@xyflow/react';

export default function ConnectionLine({ fromX, fromY, toX, toY }) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    curvature: 0.22
  });

  return (
    <g>
      <path d={path} fill="none" className="connection-draft-path" />
      <circle cx={toX} cy={toY} r={5} className="connection-draft-point" />
    </g>
  );
}
