import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const momentFeedType: FeedType = 'moment'
export const useMomentStore = createFeedStore(momentFeedType)
