/**
 * Ignored authors API: hreplier-api.sagarkothari88.one/data/v2/ignored-authors
 * GET — list usernames (response: ["shaktimaaan"])
 * POST — add (body: { username }, response: { message, ignoredAuthors })
 * DELETE — remove (body: { username }, response: { message, ignoredAuthors })
 */

const IGNORED_AUTHORS_URL = 'https://hreplier-api.sagarkothari88.one/data/v2/ignored-authors'

function authHeader(token: string): Record<string, string> {
  return {
    authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function getIgnoredAuthors(token: string): Promise<string[]> {
  const res = await fetch(IGNORED_AUTHORS_URL, {
    method: 'GET',
    headers: authHeader(token),
  })
  if (!res.ok) throw new Error(`Ignored authors: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function addIgnoredAuthor(token: string, username: string): Promise<string[]> {
  const res = await fetch(IGNORED_AUTHORS_URL, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Add ignored author: ${res.status}`)
  }
  const data = (await res.json()) as { ignoredAuthors?: string[] }
  return Array.isArray(data.ignoredAuthors) ? data.ignoredAuthors : []
}

export async function removeIgnoredAuthor(token: string, username: string): Promise<string[]> {
  const res = await fetch(IGNORED_AUTHORS_URL, {
    method: 'DELETE',
    headers: authHeader(token),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Remove ignored author: ${res.status}`)
  }
  const data = (await res.json()) as { ignoredAuthors?: string[] }
  return Array.isArray(data.ignoredAuthors) ? data.ignoredAuthors : []
}
