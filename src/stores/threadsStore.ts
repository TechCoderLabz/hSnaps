import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const threadsFeedType: FeedType = 'threads'
export const useThreadsStore = createFeedStore(threadsFeedType)
