/**
 * Shared types for hSnaps app.
 * Post references from external APIs; normalized posts for UI.
 */

/** Reference from Snaps/Threads/Waves/DBuzz/Moments  API (author + permlink) */
export interface PostReference {
  author: string
  permlink: string
}

/** Normalized post after fetching full data via Hive RPC */
export interface NormalizedPost {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  net_votes: number
  children: number
  pending_payout_value: string
  payout: number
  total_payout: number
  total_pending_payout_value: string
  payout_at?: string
  category?: string
  community?: string
  community_title?: string
  reblogs?: number
  is_paidout?: boolean
  stats?: {
    total_votes?: number
    flag_weight?: number
    gray?: boolean
    hide?: boolean
  }
  active_votes?: Array<{
    voter: string
    rshares: number
  }>
  url?: string
  json_metadata?: string
}

/** Feed type identifiers */
export type FeedType = 'snaps' | 'threads' | 'waves' | 'dbuzz' | 'moments'

/** Character limits per feed type (for composer) */
export const FEED_CHAR_LIMITS: Record<FeedType, number> = {
  snaps: 500,
  threads: 2000,
  waves: 1000,
  dbuzz: 500,
  moments: 300,
}
