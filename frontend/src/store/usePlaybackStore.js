import { create } from 'zustand';

export const usePlaybackStore = create((set, get) => {
  let playbackInterval = null;

  return {
    routeResult: null,
    timelineEvents: [],
    timelineIndex: -1,
    isPlaying: false,
    playbackSpeed: 1, // Multiplier for base speed
    vertexIdByIndex: [],
    
    // Computed states for visualization
    visitedNodeIds: [],
    pathNodeIds: [],
    pathEdgeIds: [],
    energizedEdgeIds: [],
    
    setRouteResult: (result, vertexIdByIndex, currentEdges) => {
      if (!result) {
        set({
          routeResult: null,
          timelineEvents: [],
          timelineIndex: -1,
          isPlaying: false,
          vertexIdByIndex: [],
          visitedNodeIds: [],
          pathNodeIds: [],
          pathEdgeIds: [],
          energizedEdgeIds: []
        });
        return;
      }

      const timelineEvents = Array.isArray(result.timeline?.events) ? result.timeline.events : [];
      const pathNodeIds = Array.isArray(result.path)
        ? result.path.map((index) => vertexIdByIndex[index]).filter(Boolean)
        : [];
      
      const pathEdgeIds = [];
      for (let index = 0; index < pathNodeIds.length - 1; index += 1) {
        const u = pathNodeIds[index];
        const v = pathNodeIds[index + 1];
        const edge = currentEdges.find(
          (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
        );
        if (edge) pathEdgeIds.push(edge.id);
      }

      set({
        routeResult: result,
        timelineEvents,
        timelineIndex: -1,
        isPlaying: false,
        vertexIdByIndex,
        pathNodeIds,
        pathEdgeIds,
        visitedNodeIds: [],
        energizedEdgeIds: []
      });
    },

    stepForward: () => {
      const { timelineIndex, timelineEvents, routeResult, vertexIdByIndex, pathEdgeIds } = get();
      if (!routeResult || timelineIndex >= timelineEvents.length - 1) {
        // If we are at the end, make sure everything is fully highlighted
        set({
          visitedNodeIds: routeResult?.nodesVisited?.map(idx => vertexIdByIndex[idx]) || [],
          energizedEdgeIds: pathEdgeIds,
          timelineIndex: timelineEvents.length
        });
        return false;
      }

      const nextIndex = timelineIndex + 1;
      const event = timelineEvents[nextIndex];
      
      set((state) => {
        const nextState = { ...state, timelineIndex: nextIndex };
        
        if (event.type === 'visit_node') {
          const nodeId = vertexIdByIndex[event.payload.node];
          if (nodeId && !state.visitedNodeIds.includes(nodeId)) {
            nextState.visitedNodeIds = [...state.visitedNodeIds, nodeId];
          }
        }
        // Add more event types here as needed (e.g., edge relaxations)
        
        return nextState;
      });
      return true;
    },

    stepBackward: () => {
      const { timelineIndex } = get();
      if (timelineIndex < 0) return;

      const nextIndex = timelineIndex - 1;
      // Recompute everything from scratch up to nextIndex for simplicity/correctness
      const { timelineEvents, vertexIdByIndex } = get();
      const visitedNodeIds = [];
      
      for (let i = 0; i <= nextIndex; i++) {
        const event = timelineEvents[i];
        if (event.type === 'visit_node') {
          const nodeId = vertexIdByIndex[event.payload.node];
          if (nodeId && !visitedNodeIds.includes(nodeId)) {
            visitedNodeIds.push(nodeId);
          }
        }
      }

      set({
        timelineIndex: nextIndex,
        visitedNodeIds,
        energizedEdgeIds: [] // energized edges usually appear at the very end or during path discovery
      });
    },

    play: () => {
      if (get().isPlaying) return;
      
      set({ isPlaying: true });
      
      const run = () => {
        const moved = get().stepForward();
        if (!moved) {
          get().pause();
        }
      };

      playbackInterval = setInterval(run, 200 / get().playbackSpeed);
    },

    pause: () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      set({ isPlaying: false });
    },

    setPlaybackSpeed: (speed) => {
      set({ playbackSpeed: speed });
      if (get().isPlaying) {
        get().pause();
        get().play();
      }
    },

    resetPlayback: () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      set({
        routeResult: null,
        timelineEvents: [],
        timelineIndex: -1,
        isPlaying: false,
        visitedNodeIds: [],
        pathNodeIds: [],
        pathEdgeIds: [],
        energizedEdgeIds: []
      });
    }
  };
});
