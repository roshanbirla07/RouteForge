import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useGraphStore } from '../store/useGraphStore';

const HANDLE_CONFIGS = [
  { id: 'top', position: Position.Top, className: 'route-handle-top' },
  { id: 'right', position: Position.Right, className: 'route-handle-right' },
  { id: 'bottom', position: Position.Bottom, className: 'route-handle-bottom' },
  { id: 'left', position: Position.Left, className: 'route-handle-left' }
];

function GraphNode({ id, data, selected }) {
  const sourceId = useGraphStore((state) => state.sourceId);
  const destinationId = useGraphStore((state) => state.destinationId);
  const connectionState = useGraphStore((state) => state.connectionState);
  const routeAnimation = useGraphStore((state) => state.routeAnimation);
  const interactionMode = useGraphStore((state) => state.interactionMode);

  const isSource = id === sourceId;
  const isDestination = id === destinationId;
  const isVisited = routeAnimation.visitedNodeIds.includes(id);
  const isPathNode = routeAnimation.pathNodeIds.includes(id);
  const isValidConnectTarget =
    connectionState.active &&
    connectionState.sourceId !== id &&
    (interactionMode === 'connect' || interactionMode === 'select');

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={[
        'group relative h-[92px] w-[92px] rounded-full',
        selected ? 'route-vertex-selected' : '',
        isSource ? 'route-vertex-source' : '',
        isDestination ? 'route-vertex-destination' : '',
        isVisited ? 'route-vertex-visited' : '',
        isPathNode ? 'route-vertex-path' : '',
        isValidConnectTarget ? 'route-vertex-target' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {HANDLE_CONFIGS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          id={`target-${handle.id}`}
          type="target"
          position={handle.position}
          className={[
            'route-target-handle route-handle-shell',
            handle.className,
            interactionMode === 'delete' ? '!pointer-events-none !opacity-0' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}

      {HANDLE_CONFIGS.map((handle) => (
        <Handle
          key={`source-${handle.id}`}
          id={`source-${handle.id}`}
          type="source"
          position={handle.position}
          className={[
            'route-source-handle route-handle-shell route-handle-plus',
            handle.className,
            interactionMode !== 'connect' ? 'group-hover:opacity-100' : 'opacity-100',
            interactionMode === 'delete' ? '!pointer-events-none !opacity-0' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          +
        </Handle>
      ))}

      <div className="route-vertex-core">
        <div className="route-vertex-glow" />
        <div className="route-vertex-pulse" />
        <div className="route-vertex-ring" />
        <div className="route-vertex-label">{data.nodeNumber}</div>
      </div>
    </motion.div>
  );
}

export default memo(GraphNode);
