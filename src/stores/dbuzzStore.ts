import { createFeedStore } from './feedStoreFactory'
import type { FeedType } from '../utils/types'

export const dbuzzFeedType: FeedType = 'dbuzz'
export const useDbuzzStore = createFeedStore(dbuzzFeedType)
