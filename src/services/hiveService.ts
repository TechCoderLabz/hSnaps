/**
 * Hive API service: bridge JSON-RPC (api.hive.blog) and PeakD public APIs.
 * - bridge.get_account_posts → container list (Snaps, Threads, Waves, Moment)
 * - bridge.get_discussion → replies inside a container (actual feed items)
 * - bridge.get_ranked_posts → DBuzz feed (tag hive-193084)
 */
import type { NormalizedPost, FeedType } from '../utils/types'

const HIVE_RPC_URL = 'https://api.hive.blog/'

/** Bridge API response: post or container from get_account_posts / get_discussion */
interface BridgePost {
  author: string
  permlink: string
  title?: string
  body?: string
  created?: string
  payout?: number
  payout_at?: string
  category?: string
  community?: string
  community_title?: string
  reblogs?: number
  is_paidout?: boolean
  author_payout_value?: string
  curator_payout_value?: string
  depth?: number
  parent_author?: string
  parent_permlink?: string
  children?: number
  pending_payout_value?: string
  total_pending_payout_value?: string
  url?: string
  json_metadata?: string | Record<string, unknown>
  active_votes?: Array<{ voter?: string; rshares?: number }>
  stats?: { total_votes?: number; flag_weight?: number; gray?: boolean; hide?: boolean }
  net_rshares?: number
}

/** JSON-RPC call to Hive (bridge) */
async function callHiveRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const id = Math.floor(Math.random() * 1e9)
  const res = await fetch(HIVE_RPC_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://peakd.com',
    },
    body: JSON.stringify({ id, jsonrpc: '2.0', method, params }),
  })
  if (!res.ok) throw new Error(`Hive RPC error: ${res.status}`)
  const data = (await res.json()) as { result?: T; error?: { message: string } }
  if (data.error) throw new Error(data.error.message ?? 'Hive RPC error')
  return data.result as T
}

/** bridge.get_account_posts — returns list of container posts */
export async function getAccountPosts(
  account: string,
  limit: number,
  startAuthor: string | null = null,
  startPermlink: string | null = null,
  observer: string = ''
): Promise<BridgePost[]> {
  const result = await callHiveRpc<BridgePost[]>('bridge.get_account_posts', {
    sort: 'posts',
    account,
    observer,
    limit,
    start_author: startAuthor,
    start_permlink: startPermlink,
  })
  return Array.isArray(result) ? result : []
}

/** bridge.get_discussion — returns object keyed by "author/permlink", value = full post (incl. replies) */
export async function getDiscussion(
  author: string,
  permlink: string
): Promise<Record<string, BridgePost>> {
  const result = await callHiveRpc<Record<string, BridgePost>>('bridge.get_discussion', {
    author,
    permlink,
  })
  return result ?? {}
}

/** bridge.get_ranked_posts — for DBuzz (tag-based feed) */
export async function getRankedPosts(
  tag: string,
  sort: string,
  limit: number,
  startAuthor: string | null = null,
  startPermlink: string | null = null,
  observer: string = ''
): Promise<BridgePost[]> {
  const result = await callHiveRpc<BridgePost[]>('bridge.get_ranked_posts', {
    tag,
    sort,
    limit,
    start_author: startAuthor,
    start_permlink: startPermlink,
    observer,
  })
  return Array.isArray(result) ? result : []
}

/** Normalize bridge post to our NormalizedPost (handles both container and reply shape) */
export function normalizeBridgePost(d: BridgePost): NormalizedPost {
  const stats = d.stats
  const netVotes =
    typeof stats?.total_votes === 'number'
      ? stats.total_votes
      : Array.isArray(d.active_votes)
        ? d.active_votes.length
        : 0
  const payout =
    typeof d.payout === 'number'
      ? d.payout
      : Number.parseFloat(String(d.pending_payout_value ?? '0')) || 0
  const authorPayout = Number.parseFloat(String(d.author_payout_value ?? '0')) || 0
  const curatorPayout = Number.parseFloat(String(d.curator_payout_value ?? '0')) || 0
  const totalPayout = payout > 0 ? payout : authorPayout + curatorPayout

  return {
    author: d.author,
    permlink: d.permlink,
    title: d.title ?? '',
    body: d.body ?? '',
    created: d.created ?? '',
    net_votes: netVotes,
    children: Number(d.children) ?? 0,
    payout,
    total_payout: totalPayout,
    pending_payout_value: String(d.pending_payout_value ?? '0'),
    total_pending_payout_value: String(d.total_pending_payout_value ?? d.pending_payout_value ?? '0'),
    payout_at: d.payout_at,
    category: d.category,
    community: d.community,
    community_title: d.community_title,
    reblogs: d.reblogs,
    is_paidout: d.is_paidout,
    stats: d.stats,
    active_votes: Array.isArray(d.active_votes)
      ? d.active_votes.map((v) => ({
          voter: String(v.voter ?? ''),
          rshares: Number(v.rshares ?? 0),
        }))
      : [],
    url: d.url,
    json_metadata: typeof d.json_metadata === 'string' ? d.json_metadata : JSON.stringify(d.json_metadata ?? {}),
  }
}

/** Extract reply posts from get_discussion result (depth 1 = direct replies to container) */
function discussionRepliesToPosts(discussion: Record<string, BridgePost>, parentAuthor: string, parentPermlink: string): NormalizedPost[] {
  const out: NormalizedPost[] = []
  for (const key of Object.keys(discussion)) {
    const p = discussion[key]
    if (!p || p.author === parentAuthor) continue
    if (p.parent_author === parentAuthor && p.parent_permlink === parentPermlink && (p.depth === 1 || p.depth === undefined)) {
      out.push(normalizeBridgePost(p))
    }
  }
  return out.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
}

// --- Feed-type config (export for PeakD trending APIs) ---
export const CONTAINER_ACCOUNTS: Record<FeedType, string> = {
  snaps: 'peak.snaps',
  threads: 'leothreads',
  waves: 'ecency.waves',
  dbuzz: 'dbuzz',
  moment: 'liketu.moments',
}

export const DBUZZ_TAG = 'hive-193084'

/**
 * Returns the parent author + permlink to post into for a given feed type.
 * For container-based feeds (snaps/threads/waves/moment): fetches the latest
 * container post from the feed account. For DBuzz: returns the community tag.
 */
export async function getLatestContainer(feedType: FeedType): Promise<{ author: string; permlink: string }> {
  if (feedType === 'dbuzz') {
    return { author: '', permlink: DBUZZ_TAG }
  }
  const account = CONTAINER_ACCOUNTS[feedType]
  const containers = await getAccountPosts(account, 1)
  if (!containers.length) throw new Error(`No container found for ${feedType}`)
  const c = containers[0]
  return { author: c.author, permlink: c.permlink }
}

export interface FeedPageCursor {
  author: string
  permlink: string
}

/**
 * Fetch one page of feed posts.
 * - Snaps/Threads/Waves/Moment: get_account_posts → containers, then get_discussion for container at index (page-1) → replies as posts.
 * - DBuzz: get_ranked_posts with tag, paginated by start_author/start_permlink (pass dbuzzStart for page > 1).
 */
export async function fetchFeedPage(
  feedType: FeedType,
  page: number,
  observer: string = '',
  dbuzzStart?: FeedPageCursor | null
): Promise<{ posts: NormalizedPost[]; hasMore: boolean; nextStart?: FeedPageCursor }> {
  const limit = 20

  if (feedType === 'dbuzz') {
    const startAuthor = page > 1 && dbuzzStart ? dbuzzStart.author : null
    const startPermlink = page > 1 && dbuzzStart ? dbuzzStart.permlink : null
    const posts = await getRankedPosts(DBUZZ_TAG, 'created', limit, startAuthor, startPermlink, observer)
    const normalized = posts.map(normalizeBridgePost)
    const last = normalized[normalized.length - 1]
    return {
      posts: normalized,
      hasMore: normalized.length >= limit,
      nextStart: last ? { author: last.author, permlink: last.permlink } : undefined,
    }
  }

  const account = CONTAINER_ACCOUNTS[feedType]
  const containers = await getAccountPosts(account, limit, null, null, observer)
  const containerIndex = page - 1
  if (containerIndex >= containers.length) {
    return { posts: [], hasMore: false }
  }
  const container = containers[containerIndex]
  const discussion = await getDiscussion(container.author, container.permlink)
  const posts = discussionRepliesToPosts(discussion, container.author, container.permlink)
  return {
    posts,
    hasMore: containerIndex + 1 < containers.length,
  }
}

