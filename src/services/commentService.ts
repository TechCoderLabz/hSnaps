/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@hiveio/dhive'
import type { Discussion } from '../utils/commentTypes'

// Lightweight dhive client for comments list (bridge.get_discussion)
const dhiveClient = new Client([
  'https://api.hive.blog',
  'https://api.syncad.com',
  'https://api.deathwing.me',
])

export async function getCommentsList(author: string, permlink: string): Promise<Discussion[]> {
  try {
    const rawResult: unknown = await dhiveClient.call('bridge', 'get_discussion', [author, permlink])

    // The bridge API may return either an array of discussions or
    // an object keyed by "author/permlink" → Discussion.
    let list: Discussion[] = Array.isArray(rawResult)
      ? (rawResult as Discussion[])
      : rawResult && typeof rawResult === 'object'
        ? Object.values(rawResult as Record<string, Discussion>)
        : []

    // Exclude the root post (supplied author/permlink) so only comments/replies are returned
    list = list.filter((c) => !(c.author === author && c.permlink === permlink))

    return list.map((comment) => {
      // Normalize depth as number and ensure required fields exist
      const rawDepth: unknown = (comment as unknown as Record<string, unknown>).depth
      if (typeof rawDepth === 'string') {
        const parsed = Number.parseInt(rawDepth, 10)
        comment.depth = Number.isFinite(parsed) ? parsed : 0
      } else if (typeof rawDepth !== 'number' || !Number.isFinite(rawDepth)) {
        comment.depth = comment.depth ?? 0
      }

      // Safely parse json_metadata only when it's a JSON string.
      // If it's already an object, use it directly. Ignore invalid cases.
        const jm: unknown = (comment as unknown as Record<string, unknown>).json_metadata as unknown
        try {
          if (jm && typeof jm === 'string') {
            const trimmed = jm.trim()
            if (
              (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
              (trimmed.startsWith('[') && trimmed.endsWith(']'))
            ) {
              ;(comment as any).json_metadata_parsed = JSON.parse(trimmed)
            }
          } else if (jm && typeof jm === 'object') {
            ;(comment as any).json_metadata_parsed = jm as Record<string, unknown>
          }
        } catch {
          // Swallow metadata parse errors; they are often non-JSON strings.
        }
      return comment
    })
  } catch (error) {
    // On error, return empty list – page will show friendly error state.
    console.error('Error fetching comments list:', error)
    return []
  }
}

