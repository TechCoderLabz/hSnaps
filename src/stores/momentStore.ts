import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const momentFeedType: FeedType = 'moments'
export const useMomentStore = createFeedStore(momentFeedType)
