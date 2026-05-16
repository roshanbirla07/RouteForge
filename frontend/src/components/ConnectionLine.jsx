import React from 'react';

export default function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY
}) {
  return (
    <g>
      <path
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        className="animated"
        d={`M${fromX},${fromY} L${toX},${toY}`}
        strokeDasharray="5,5"
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#3b82f6"
        strokeWidth={1.5}
      />
    </g>
  );
}
