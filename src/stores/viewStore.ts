import { create } from 'zustand'

type ViewMode = 'grid' | 'list'

interface ViewState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
}

export const useViewStore = create<ViewState>((set, get) => ({
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () => set({ viewMode: get().viewMode === 'list' ? 'grid' : 'list' }),
}))
