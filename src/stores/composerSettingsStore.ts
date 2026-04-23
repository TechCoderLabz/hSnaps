import { create } from 'zustand'
import { REWARD_OPTIONS, type RewardOption } from 'hive-react-kit'

const STORAGE_KEY = 'hsnaps-composer-default-reward'
const DEFAULT_REWARD: RewardOption = 'default'

function loadReward(): RewardOption {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (REWARD_OPTIONS as string[]).includes(saved)) {
      return saved as RewardOption
    }
  } catch { /* ignore */ }
  return DEFAULT_REWARD
}

interface ComposerSettingsState {
  /** Default reward routing pre-selected in every composer. */
  defaultReward: RewardOption
  setDefaultReward: (reward: RewardOption) => void
}

export const useComposerSettingsStore = create<ComposerSettingsState>((set) => ({
  defaultReward: loadReward(),
  setDefaultReward: (reward) => {
    try { localStorage.setItem(STORAGE_KEY, reward) } catch { /* ignore */ }
    set({ defaultReward: reward })
  },
}))
