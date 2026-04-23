/**
 * Hive API service: bridge JSON-RPC (api.hive.blog) and PeakD public APIs.
 * - bridge.get_account_posts → container list (Snaps, Threads, Waves, Moments)
 * - bridge.get_discussion → replies inside a container (actual feed items)
 */
import type { NormalizedPost, FeedType } from '../utils/types'
import { getHiveApiNode } from '../stores/hiveNodeStore'

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
  /** Array of "author/permlink" keys for direct replies to this post. */
  replies?: string[]
}

/** Fallback RPC nodes for condenser_api */
const CONDENSER_FALLBACK_NODES = [
  'https://api.deathwing.me/',
  'https://rpc.ausbit.dev/',
]

/** JSON-RPC call to Hive (condenser_api — params is an array, tries selected node + fallbacks) */
async function callCondenserApi<T>(method: string, params: unknown[], signal?: AbortSignal): Promise<T> {
  const id = Math.floor(Math.random() * 1e9)
  const body = JSON.stringify({ id, jsonrpc: '2.0', method: `condenser_api.${method}`, params })
  const selectedNode = getHiveApiNode().replace(/\/$/, '') + '/'
  const nodes = [selectedNode, ...CONDENSER_FALLBACK_NODES.filter((n) => n !== selectedNode)]
  let lastError: Error | null = null
  for (const rpc of nodes) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          origin: 'https://peakd.com',
        },
        body,
        signal,
      })
      if (!res.ok) throw new Error(`Hive RPC error: ${res.status}`)
      const data = (await res.json()) as { result?: T; error?: { message: string } }
      if (data.error) throw new Error(data.error.message ?? 'Hive RPC error')
      return data.result as T
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('All Hive RPC nodes failed')
}

/** JSON-RPC call to Hive (bridge) */
async function callHiveRpc<T>(method: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const id = Math.floor(Math.random() * 1e9)
  const rpcUrl = getHiveApiNode().replace(/\/$/, '') + '/'
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://peakd.com',
    },
    body: JSON.stringify({ id, jsonrpc: '2.0', method, params }),
    signal,
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
  observer: string = '',
  signal?: AbortSignal
): Promise<BridgePost[]> {
  const result = await callHiveRpc<BridgePost[]>('bridge.get_account_posts', {
    sort: 'posts',
    account,
    observer,
    limit,
    start_author: startAuthor,
    start_permlink: startPermlink,
  }, signal)
  return Array.isArray(result) ? result : []
}

/** bridge.get_post — fetch a single post or reply by author/permlink. */
export async function getPost(
  author: string,
  permlink: string,
  observer: string = '',
  signal?: AbortSignal
): Promise<BridgePost | null> {
  const result = await callHiveRpc<BridgePost | null>('bridge.get_post', {
    author,
    permlink,
    observer,
  }, signal)
  return result ?? null
}

/** bridge.get_discussion — returns object keyed by "author/permlink", value = full post (incl. replies) */
export async function getDiscussion(
  author: string,
  permlink: string,
  observer: string = '',
  signal?: AbortSignal
): Promise<Record<string, BridgePost>> {
  const result = await callHiveRpc<Record<string, BridgePost>>('bridge.get_discussion', {
    author,
    permlink,
    observer,
  }, signal)
  return result ?? {}
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
    parent_author: d.parent_author,
    parent_permlink: d.parent_permlink,
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
    replies: Array.isArray(d.replies) ? d.replies : undefined,
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
  moments: 'liketu.moments',
}

/**
 * Returns the parent author + permlink to post into for a given feed type.
 * Fetches the latest container post from the feed account.
 * Pass observer (logged-in username or '') for personalized results.
 */
export async function getLatestContainer(
  feedType: FeedType,
  observer: string = '',
  signal?: AbortSignal
): Promise<{ author: string; permlink: string }> {
  const account = CONTAINER_ACCOUNTS[feedType]
  const containers = await getAccountPosts(account, 1, null, null, observer, signal)
  if (!containers.length) throw new Error(`No container found for ${feedType}`)
  const c = containers[0]
  return { author: c.author, permlink: c.permlink }
}

/** condenser_api.get_reblogged_by — returns list of accounts who reblogged a post */
export async function getRebloggedBy(author: string, permlink: string, signal?: AbortSignal): Promise<string[]> {
  const result = await callCondenserApi<string[]>('get_reblogged_by', [author, permlink], signal)
  return Array.isArray(result) ? result : []
}

/** condenser_api.get_follow_count — returns follower and following counts for an account */
export interface FollowCount {
  follower_count: number
  following_count: number
}

export async function getFollowCount(account: string, signal?: AbortSignal): Promise<FollowCount> {
  const result = await callCondenserApi<FollowCount>('get_follow_count', [account], signal)
  if (!result) {
    return { follower_count: 0, following_count: 0 }
  }
  return result
}

/** condenser_api.get_following response item */
export interface GetFollowingItem {
  follower: string
  following: string
  what: string[]
}

/**
 * condenser_api.get_following — returns list of accounts the user follows (blog).
 * Used to filter "Following" feed to show posts only from followed users.
 */
export async function getFollowing(
  follower: string,
  startAccount: string = '',
  followType: string = 'blog',
  limit: number = 1000,
  signal?: AbortSignal
): Promise<GetFollowingItem[]> {
  const result = await callCondenserApi<GetFollowingItem[]>('get_following', [
    follower,
    startAccount,
    followType,
    limit,
  ], signal)
  return Array.isArray(result) ? result : []
}

/** Cursor that tracks position within the current batch of containers. */
export interface FeedPageCursor {
  /** The fetched containers (author/permlink pairs) in the current batch. */
  containers: Array<{ author: string; permlink: string }>
  /** Index of the next container to process within the batch. */
  containerIndex: number
  /** Whether there are more batches to fetch from the API (last batch had >= limit results). */
  hasMoreBatches: boolean
}

/**
 * Fetch one page of feed posts.
 *
 * Strategy: aggregate posts across consecutive containers (today, yesterday, …)
 * until we have at least TARGET_PAGE_SIZE items or we run out of containers.
 * This avoids the jarring "only 2 snaps showing" when today's container is
 * lightly populated — the previous day(s) fill the page up to ~50 items in
 * one pass. A hard safety cap on containers-per-page prevents pathologically
 * empty days from blowing up the number of API calls.
 */
const TARGET_PAGE_SIZE = 50
const MAX_CONTAINERS_PER_PAGE = 10
const CONTAINER_BATCH_LIMIT = 20

export async function fetchFeedPage(
  feedType: FeedType,
  _page: number,
  observer: string = '',
  cursor: FeedPageCursor | null = null,
  signal?: AbortSignal
): Promise<{ posts: NormalizedPost[]; hasMore: boolean; nextCursor: FeedPageCursor | null }> {
  const account = CONTAINER_ACCOUNTS[feedType]

  let containers = cursor?.containers ?? []
  let containerIndex = cursor?.containerIndex ?? 0
  let hasMoreBatches = cursor?.hasMoreBatches ?? true

  const collected: NormalizedPost[] = []
  let containersProcessed = 0

  while (
    collected.length < TARGET_PAGE_SIZE &&
    containersProcessed < MAX_CONTAINERS_PER_PAGE
  ) {
    if (signal?.aborted) break

    // Refill the batch of containers when exhausted.
    if (containers.length === 0 || containerIndex >= containers.length) {
      if (!hasMoreBatches) break
      const lastContainer = containers.length > 0 ? containers[containers.length - 1] : null
      const rawContainers = await getAccountPosts(
        account,
        CONTAINER_BATCH_LIMIT,
        lastContainer?.author ?? null,
        lastContainer?.permlink ?? null,
        observer,
        signal
      )
      if (rawContainers.length === 0) {
        hasMoreBatches = false
        break
      }
      containers = rawContainers.map((c) => ({ author: c.author, permlink: c.permlink }))
      containerIndex = 0
      hasMoreBatches = rawContainers.length >= CONTAINER_BATCH_LIMIT
    }

    const container = containers[containerIndex]
    const discussion = await getDiscussion(container.author, container.permlink, observer, signal)
    collected.push(...discussionRepliesToPosts(discussion, container.author, container.permlink))
    containerIndex += 1
    containersProcessed += 1
  }

  const hasMore = containerIndex < containers.length || hasMoreBatches
  const nextCursor: FeedPageCursor | null = hasMore
    ? { containers, containerIndex, hasMoreBatches }
    : null

  return { posts: collected, hasMore, nextCursor }
}

// ─── "My Feed" — direct fetch via hreplier, client-paginated ─────────────

/**
 * Fetches the current user's own snaps/threads/waves/moments directly from
 * the hreplier endpoint keyed by `?author=<me>&parent=<container>`. The
 * endpoint returns the full id/author/permlink reference list in one shot;
 * we cache that list per `(feedType, author)` and slice client-side so the
 * UI can paginate at 10-per-page without the incremental container-by-
 * container load-more dance.
 *
 *   fetchMyFeedPosts(..., offset=0)  → first 10 posts
 *   fetchMyFeedPosts(..., offset=10) → next 10 posts
 *   `hasMore` flips to false once the cached ref list is exhausted.
 *
 * Only the current slice is materialised via bridge.get_post, so each page
 * tap stays snappy.
 */
const HREPLIER_SNAPS_URL = 'https://hreplier-api.sagarkothari88.one/snaps'
/** Page size for the My Feed scroll-end load. */
export const MY_FEED_PAGE_SIZE = 10
/** In-memory cache of ref lists keyed by `${feedType}|${author}`. */
const myFeedRefsCache = new Map<string, Array<{ author: string; permlink: string }>>()

export function invalidateMyFeedCache(feedType?: FeedType, author?: string) {
  if (!feedType || !author) { myFeedRefsCache.clear(); return }
  myFeedRefsCache.delete(`${feedType}|${author}`)
}

async function getMyFeedRefs(
  feedType: FeedType,
  author: string,
  signal?: AbortSignal,
): Promise<Array<{ author: string; permlink: string }>> {
  const cacheKey = `${feedType}|${author}`
  const cached = myFeedRefsCache.get(cacheKey)
  if (cached) return cached

  const parent = CONTAINER_ACCOUNTS[feedType]
  const url = `${HREPLIER_SNAPS_URL}?author=${encodeURIComponent(author)}&parent=${encodeURIComponent(parent)}`
  const resp = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!resp.ok) throw new Error(`hreplier snaps API error: ${resp.status}`)
  const raw = await resp.json()
  const refs = (Array.isArray(raw) ? raw : []) as Array<{ author: string; permlink: string }>
  if (signal?.aborted) throw new Error('aborted')
  myFeedRefsCache.set(cacheKey, refs)
  return refs
}

export async function fetchMyFeedPosts(
  feedType: FeedType,
  author: string,
  offset: number = 0,
  pageSize: number = MY_FEED_PAGE_SIZE,
  observer: string = '',
  signal?: AbortSignal,
): Promise<{ posts: NormalizedPost[]; hasMore: boolean; nextOffset: number }> {
  const refs = await getMyFeedRefs(feedType, author, signal)
  if (refs.length === 0 || offset >= refs.length) {
    return { posts: [], hasMore: false, nextOffset: offset }
  }

  const slice = refs.slice(offset, offset + pageSize)
  const posts: NormalizedPost[] = []
  const BATCH = 5
  for (let i = 0; i < slice.length; i += BATCH) {
    if (signal?.aborted) break
    const chunk = slice.slice(i, i + BATCH)
    const results = await Promise.all(
      chunk.map((r) => getPost(r.author, r.permlink, observer, signal).catch(() => null)),
    )
    for (const p of results) {
      if (p) posts.push(normalizeBridgePost(p))
    }
  }
  posts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  const nextOffset = offset + slice.length
  const hasMore = nextOffset < refs.length
  return { posts, hasMore, nextOffset }
}

