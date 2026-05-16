import { create } from 'zustand';

export const useAlgorithmStore = create((set) => ({
  sourceId: '',
  destinationId: '',
  algorithm: 'dijkstra', // dijkstra, astar, etc.
  
  setSourceId: (sourceId) => set({ sourceId }),
  setDestinationId: (destinationId) => set({ destinationId }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  
  resetAlgorithm: () => set({
    sourceId: '',
    destinationId: '',
    algorithm: 'dijkstra'
  })
}));
