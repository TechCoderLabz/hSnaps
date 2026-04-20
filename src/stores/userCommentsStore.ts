/**
 * Session-scoped record of posts the current user commented on DURING this
 * session (via the in-app reply composer). Authoritative "already commented"
 * detection is derived from `post.replies` (bridge.get_account_posts returns
 * this array on each post) + current username — this store only provides
 * optimistic updates so the red icon flips instantly after a reply, before
 * the feed data is refetched.
 */
import { create } from 'zustand'

function key(author: string, permlink: string) {
  return `${author}/${permlink}`
}

interface UserCommentsState {
  commentedOn: Set<string>
  /** Has the current user commented on a post (session-local mark). */
  isMarked: (author: string, permlink: string) => boolean
  /** Optimistically flag a post as replied-to after a successful reply. */
  markCommented: (author: string, permlink: string) => void
  /** Clear session marks (e.g. on logout). */
  clear: () => void
}

export const useUserCommentsStore = create<UserCommentsState>((set, get) => ({
  commentedOn: new Set<string>(),

  isMarked: (author, permlink) => get().commentedOn.has(key(author, permlink)),

  markCommented: (author, permlink) => {
    const next = new Set(get().commentedOn)
    next.add(key(author, permlink))
    set({ commentedOn: next })
  },

  clear: () => set({ commentedOn: new Set() }),
}))
