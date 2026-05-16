import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAlgorithmStore } from '../store/useAlgorithmStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { useUIStore } from '../store/useUIStore';

const HANDLE_POSITIONS = [
  { pos: Position.Top, id: 't' },
  { pos: Position.Right, id: 'r' },
  { pos: Position.Bottom, id: 'b' },
  { pos: Position.Left, id: 'l' }
];

function GraphNode({ id, data, selected }) {
  const sourceId = useAlgorithmStore((state) => state.sourceId);
  const destinationId = useAlgorithmStore((state) => state.destinationId);
  const interactionMode = useUIStore((state) => state.interactionMode);
  
  const visitedNodeIds = usePlaybackStore((state) => state.visitedNodeIds);
  const pathNodeIds = usePlaybackStore((state) => state.pathNodeIds);

  const isSource = id === sourceId;
  const isDestination = id === destinationId;
  const isVisited = visitedNodeIds.includes(id);
  const isPathNode = pathNodeIds.includes(id);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group ${selected ? 'node-selected' : ''} ${isSource ? 'node-source' : ''} ${isDestination ? 'node-destination' : ''} ${isVisited ? 'node-visited' : ''} ${isPathNode ? 'node-path' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Circumference Handles (both Source and Target for each position) */}
      {interactionMode !== 'delete' && HANDLE_POSITIONS.map(({ pos, id: posId }) => (
        <React.Fragment key={posId}>
          <Handle
            type="target"
            position={pos}
            id={`target-${posId}`}
            className={`!w-3 !h-3 !bg-blue-500 !border-2 !border-white !shadow-sm transition-opacity duration-200 ${isHovered || interactionMode === 'connect' ? 'opacity-100' : 'opacity-0'}`}
          />
          <Handle
            type="source"
            position={pos}
            id={`source-${posId}`}
            className={`!w-3 !h-3 !bg-blue-500 !border-2 !border-white !shadow-sm transition-opacity duration-200 ${isHovered || interactionMode === 'connect' ? 'opacity-100' : 'opacity-0'}`}
          />
        </React.Fragment>
      ))}

      <div className="node-minimal">
        {data.nodeNumber}
      </div>
    </div>
  );
}

export default memo(GraphNode);
