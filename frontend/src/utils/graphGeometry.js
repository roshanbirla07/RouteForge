export const NODE_SIZE = 92;
export const NODE_RADIUS = NODE_SIZE / 2;
export const CARDINAL_HANDLES = [
  { id: 'top', angle: -90, position: 'top' },
  { id: 'right', angle: 0, position: 'right' },
  { id: 'bottom', angle: 90, position: 'bottom' },
  { id: 'left', angle: 180, position: 'left' }
];

export function getNodeCenter(node) {
  return {
    x: node.position.x + NODE_RADIUS,
    y: node.position.y + NODE_RADIUS
  };
}

export function getCircleIntersection(fromX, fromY, toX, toY, radius = NODE_RADIUS) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);

  if (!distance) {
    return { x: fromX, y: fromY };
  }

  return {
    x: fromX + (dx * radius) / distance,
    y: fromY + (dy * radius) / distance
  };
}

export function getPortOffset(index, distance = NODE_RADIUS + 10) {
  const angle = (CARDINAL_HANDLES[index].angle * Math.PI) / 180;

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

export function getClosestHandleId(fromPoint, toPoint) {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }

  return dy >= 0 ? 'bottom' : 'top';
}
