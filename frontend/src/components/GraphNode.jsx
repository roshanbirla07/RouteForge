import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAlgorithmStore } from '../store/useAlgorithmStore';
import { usePlaybackStore } from '../store/usePlaybackStore';
import { CARDINAL_HANDLES, getPortOffset } from '../utils/graphGeometry';

const PORTS = new Array(4).fill(null);

function GraphNode({ id, data, selected }) {
  const sourceId = useAlgorithmStore((state) => state.sourceId);
  const destinationId = useAlgorithmStore((state) => state.destinationId);
  
  const visitedNodeIds = usePlaybackStore((state) => state.visitedNodeIds);
  const pathNodeIds = usePlaybackStore((state) => state.pathNodeIds);

  const isSource = id === sourceId;
  const isDestination = id === destinationId;
  const isVisited = visitedNodeIds.includes(id);
  const isPathNode = pathNodeIds.includes(id);

  return (
    <div 
      className={`relative group ${selected ? 'node-selected' : ''} ${isSource ? 'node-source' : ''} ${isDestination ? 'node-destination' : ''} ${isVisited ? 'node-visited' : ''} ${isPathNode ? 'node-path' : ''}`}
      onMouseEnter={() => data.onHoverChange?.(id, true)}
      onMouseLeave={() => data.onHoverChange?.(id, false)}
    >
      {CARDINAL_HANDLES.map((handle) => (
        <React.Fragment key={`${id}-${handle.id}`}>
          <Handle
            type="source"
            id={handle.id}
            position={Position[handle.position.charAt(0).toUpperCase() + handle.position.slice(1)]}
            className="node-handle-ghost"
          />
          <Handle
            type="target"
            id={handle.id}
            position={Position[handle.position.charAt(0).toUpperCase() + handle.position.slice(1)]}
            className="node-handle-ghost"
          />
        </React.Fragment>
      ))}

      <div className={`node-shell ${data.isDraftSource ? 'is-draft-source' : ''} ${data.isDraftTarget ? 'is-draft-target' : ''}`}>
        <div className="node-ring" />
        <div className="node-minimal">
          {data.nodeNumber}
        </div>
      </div>

      {data.showPorts && data.interactionMode !== 'delete' && PORTS.map((_, index) => {
        const offset = getPortOffset(index);

        return (
          <button
            key={`${id}-port-${index}`}
            type="button"
            className="node-port nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`
            }}
            onPointerDown={(event) => data.onPortPointerDown?.(event, id, index)}
            aria-label={`Create connection from node ${data.nodeNumber}`}
          >
            +
          </button>
        );
      })}
    </div>
  );
}

export default memo(GraphNode);
