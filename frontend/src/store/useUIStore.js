import { create } from 'zustand';

function areSelectionsEqual(left, right) {
  if (left.nodeIds.length !== right.nodeIds.length || left.edgeIds.length !== right.edgeIds.length) {
    return false;
  }

  return (
    left.nodeIds.every((nodeId, index) => nodeId === right.nodeIds[index]) &&
    left.edgeIds.every((edgeId, index) => edgeId === right.edgeIds[index])
  );
}

export const useUIStore = create((set) => ({
  interactionMode: 'select', // select, delete, connect
  loading: false,
  error: '',
  selection: {
    nodeIds: [],
    edgeIds: []
  },
  connectionState: {
    active: false,
    sourceId: ''
  },
  hoveredNodeId: '',
  draftConnection: null,
  pendingEdge: null, // { source: string, target: string, sourceHandle: string, targetHandle: string }
  
  setInteractionMode: (interactionMode) => set({ interactionMode }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelection: (selection) => set((state) => {
    if (areSelectionsEqual(state.selection, selection)) {
      return state;
    }
    return { selection };
  }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
  setDraftConnection: (draftConnection) => set({ draftConnection }),
  setPendingEdge: (pendingEdge) => set({ pendingEdge }),
  
  clearSelection: () => set({
    selection: {
      nodeIds: [],
      edgeIds: []
    }
  }),
  
  resetUI: () => set({
    interactionMode: 'select',
    loading: false,
    error: '',
    selection: { nodeIds: [], edgeIds: [] },
    connectionState: { active: false, sourceId: '' },
    hoveredNodeId: '',
    draftConnection: null,
    pendingEdge: null
  })
}));
