import { create } from 'zustand'

interface VideoPlaybackState {
  /** Global key of the currently playing video (e.g. youtube:ID, 3speak:author/permlink, twitter:ID) */
  currentId: string | null
  setCurrentId: (id: string | null) => void
}

export const useVideoPlaybackStore = create<VideoPlaybackState>((set) => ({
  currentId: null,
  setCurrentId: (id) => set({ currentId: id }),
}))

