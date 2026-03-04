import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const snapsFeedType: FeedType = 'snaps'
export const useSnapsStore = createFeedStore(snapsFeedType)
