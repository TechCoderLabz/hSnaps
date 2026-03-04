import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const wavesFeedType: FeedType = 'waves'
export const useWavesStore = createFeedStore(wavesFeedType)
