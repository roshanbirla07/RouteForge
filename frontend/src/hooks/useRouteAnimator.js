import { useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';

export function useRouteAnimator() {
  const routeResult = useGraphStore((state) => state.routeResult);
  const setRouteAnimation = useGraphStore((state) => state.setRouteAnimation);

  useEffect(() => {
    setRouteAnimation({
      visitedNodeIds: [],
      pathNodeIds: [],
      pathEdgeIds: [],
      energizedEdgeIds: []
    });

    if (!routeResult) {
      return undefined;
    }

    const timers = [];
    const visitedNodeIds = routeResult.visitedNodeIds ?? [];
    const pathNodeIds = routeResult.pathNodeIds ?? [];
    const pathEdgeIds = routeResult.pathEdgeIds ?? [];

    visitedNodeIds.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setRouteAnimation((currentState) => ({
            ...currentState,
            visitedNodeIds: visitedNodeIds.slice(0, index + 1)
          }));
        }, index * 180)
      );
    });

    pathEdgeIds.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setRouteAnimation((currentState) => ({
            ...currentState,
            pathNodeIds,
            pathEdgeIds,
            energizedEdgeIds: pathEdgeIds.slice(0, index + 1)
          }));
        }, Math.max(visitedNodeIds.length, 1) * 180 + 200 + index * 220)
      );
    });

    timers.push(
      window.setTimeout(() => {
        setRouteAnimation({
          visitedNodeIds,
          pathNodeIds,
          pathEdgeIds,
          energizedEdgeIds: pathEdgeIds
        });
      }, Math.max(visitedNodeIds.length, 1) * 180 + 200 + pathEdgeIds.length * 220)
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [routeResult, setRouteAnimation]);
}
