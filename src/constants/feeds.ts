/**
 * Feed display metadata: labels and avatar URLs for Snaps, Waves, Threads, Moments.
 */
import type { FeedType } from '../utils/types'

export const FEED_LABELS: Record<FeedType, string> = {
  snaps: 'Snaps',
  waves: 'Ecency',
  threads: 'Threads',
  moments: 'Liketu',
}

export const FEED_AVATARS: Record<FeedType, string> = {
  snaps: 'https://images.hive.blog/u/peak.snaps/avatar',
  waves: 'https://images.hive.blog/u/ecency.waves/avatar',
  threads: 'https://images.hive.blog/u/leothreads/avatar',
  moments: 'https://images.hive.blog/u/liketu.moments/avatar',
}
