/**
 * Bookmarks API: hreplier-api.sagarkothari88.one
 * GET /data/v2/bookmarks — list bookmarks (Authorization: Bearer <token>)
 * POST /data/v2/bookmarks — add bookmark (body: { author, permlink, title, body })
 */

const BOOKMARKS_BASE = 'https://hreplier-api.sagarkothari88.one/data/v2/bookmarks'

export interface BookmarkItem {
  author: string
  permlink: string
  title?: string
  body?: string
  created?: string
  _id?: string
}

export async function getBookmarks(token: string): Promise<BookmarkItem[]> {
  const res = await fetch(BOOKMARKS_BASE, {
    method: 'GET',
    headers: {
      authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Bookmarks: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data?.items ?? data?.bookmarks ?? [])
}

export interface AddBookmarkPayload {
  author: string
  permlink: string
  title: string
  body: string
}

export async function addBookmark(token: string, payload: AddBookmarkPayload): Promise<void> {
  const res = await fetch(BOOKMARKS_BASE, {
    method: 'POST',
    headers: {
      authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Add bookmark: ${res.status}`)
  }
}

export async function removeBookmark(
  token: string,
  author: string,
  permlink: string
): Promise<void> {
  const res = await fetch(BOOKMARKS_BASE, {
    method: 'DELETE',
    headers: {
      authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ author, permlink }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Remove bookmark: ${res.status}`)
  }
}
