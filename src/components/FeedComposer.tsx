/**
 * Feed post composer: wraps PostComposer from hive-react-kit with
 * Hive-specific business logic (feed metadata, blockchain posting, polls, char limits).
 * Renders nothing when user is not logged in.
 */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PostComposer, useHiveImageSign } from 'hive-react-kit'
import type { PollData, RewardOption } from 'hive-react-kit'
import { useAioha } from '@aioha/react-provider'
import { useAuthStore as useHiveAuthStore } from 'hive-authentication'
import { useAuthData } from '../stores/authStore'
import { useHiveOperations } from '../hooks/useHiveOperations'
import type { FeedType } from '../utils/types'
import { FEED_CHAR_LIMITS } from '../utils/types'

interface FeedComposerProps {
  feedType: FeedType
  /** When provided with selectedFeed, post to a single feed (one comment). */
  containerRefs?: Partial<Record<FeedType, { author: string; permlink: string }>>
  selectedFeed?: FeedType
  parentAuthor?: string
  parentPermlink?: string
  onSuccess?: () => void
  placeholder?: string
  authorMention?: string
  /** When true, use comment metadata (no tags, hsnaps app) and 2000 char limit. */
  replyMode?: boolean
  /** If true, the current user has already upvoted the parent — hides the upvote-on-publish toggle. */
  alreadyVoted?: boolean
  /** Parent post's tags. In reply mode these are merged after `hsnaps` (first) into default tags. */
  parentTags?: string[]
}

/** Extract image URLs from markdown ![](url) or ![alt](url) */
function extractImageUrlsFromMarkdown(md: string): string[] {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g
  const urls: string[] = []
  let m
  while ((m = re.exec(md)) !== null) urls.push(m[2].trim())
  return [...new Set(urls)]
}

const DEVELOPER = 'sagarkothari88'
const APP_TAG = 'hsnaps'

/** Normalize, dedupe (case-insensitive, preserve order), and cap the tag list. */
function normalizeTags(tags: string[], cap = 10): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const t = String(raw).trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-')
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
    if (out.length >= cap) break
  }
  return out
}

/**
 * Locked default tags per feed type — shown in the composer's tag manager.
 *
 * - `hsnaps` is always the first tag (app identifier).
 * - New posts include the feed-specific tags after the app tag.
 * - Replies use `hsnaps` first, then inherit the parent post's tags (deduped, capped at 10).
 */
function getDefaultTagsForFeed(feedType: FeedType, replyMode: boolean, parentTags?: string[]): string[] {
  if (replyMode) return normalizeTags([APP_TAG, ...(parentTags ?? [])])
  const now = new Date()
  const wavesTag = `waves-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  switch (feedType) {
    case 'snaps':   return [APP_TAG, 'hive-178315', 'snaps']
    case 'waves':   return [APP_TAG, wavesTag]
    case 'threads': return [APP_TAG, 'leofinance']
    case 'moments': return [APP_TAG, 'moments']
    default:        return [APP_TAG, 'hive-178315', 'snaps']
  }
}

/** Build app-specific json_metadata for each feed type, using caller-supplied tags. */
function buildJsonMetadataForFeed(
  feedType: FeedType,
  body: string,
  tags: string[],
  audioInfo?: { url: string; duration: number } | null,
  videoInfo?: { url: string; uploadUrl: string; aspectRatio?: string } | null,
  pollData?: PollData | null,
): string {
  const images = extractImageUrlsFromMarkdown(body)
  const audioMeta = audioInfo
    ? { audio: { platform: '3speak', url: audioInfo.url, duration: audioInfo.duration } }
    : {}
  const videoMeta = videoInfo
    ? { video: { platform: '3speak', url: videoInfo.url, uploadUrl: videoInfo.uploadUrl, aspectRatio: videoInfo.aspectRatio || '9/16' } }
    : {}
  const pollMeta = pollData
    ? {
        content_type: 'poll' as const,
        version: 0.8,
        question: pollData.question,
        choices: pollData.choices,
        preferred_interpretation: 'number_of_votes' as const,
        end_time: pollData.end_time,
        max_choices_voted: pollData.max_choices_voted,
        allow_vote_changes: pollData.allow_vote_changes,
        filters: pollData.filters,
        ui_hide_res_until_voted: pollData.ui_hide_res_until_voted,
      }
    : {}

  switch (feedType) {
    case 'snaps':
      return JSON.stringify({
        app: 'peakd/2026.3.1', developer: DEVELOPER,
        tags,
        ...(images.length > 0 && { image: images }),
        ...audioMeta, ...videoMeta, ...pollMeta,
      })
    case 'waves':
      return JSON.stringify({
        app: 'ecency/3.5.1-mobile', developer: DEVELOPER,
        tags, type: 'wave',
        ...(images.length > 0 && { image: images }),
        ...(images.length > 0 && { image_ratios: images.map(() => 1.17) }),
        format: 'markdown+html', links: [],
        ...audioMeta, ...videoMeta, ...pollMeta,
      })
    case 'threads':
      return JSON.stringify({
        app: 'leothreads/0.3', developer: DEVELOPER,
        isPoll: false, pollOptions: {},
        tags,
        dimensions: {}, format: 'markdown',
        ...audioMeta, ...videoMeta, ...pollMeta,
      })
    case 'moments':
      return JSON.stringify({
        app: 'peakd/2026.3.1', developer: DEVELOPER,
        image: images.length > 0 ? images : [],
        tags,
        ...audioMeta, ...videoMeta, ...pollMeta,
      })
    default:
      return JSON.stringify({
        app: 'peakd/2026.3.1', developer: DEVELOPER,
        tags, format: 'markdown',
        ...audioMeta, ...videoMeta, ...pollMeta,
      })
  }
}

const REPLY_CHAR_LIMIT = 2000

export function FeedComposer({
  feedType,
  containerRefs,
  selectedFeed,
  parentAuthor,
  parentPermlink,
  onSuccess,
  placeholder = 'Write in Markdown...',
  replyMode = false,
  alreadyVoted = false,
  parentTags,
}: FeedComposerProps) {
  const { isAuthenticated, username, ecencyToken, token } = useAuthData()
  const { aioha } = useAioha()
  const { comment, voteAndComment } = useHiveOperations()
  const { currentUser: hiveAuthUser } = useHiveAuthStore()
  const signMessage = useHiveImageSign({ signer: aioha, user: hiveAuthUser })
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [reward, setReward] = useState<RewardOption>('default')
  const [voteEnabled, setVoteEnabled] = useState(false)
  const [votePercent, setVotePercent] = useState(100)
  const provider = (hiveAuthUser?.provider || '').toLowerCase()
  const isWalletProvider = provider === 'keychain' || provider === 'peakvault' || provider === 'hiveauth'
  const awaitingWalletApproval = isSubmitting && isWalletProvider

  const giphyApiKey = import.meta.env.VITE_GIPHY_KEY || undefined
  const threeSpeakApiKey = import.meta.env.VITE_3SPEAK_API_KEY || undefined

  if (!isAuthenticated) return null

  const composeSingleFeedMode = Boolean(containerRefs && selectedFeed)
  const effectiveFeed = composeSingleFeedMode ? selectedFeed! : feedType
  const defaultTagsForFeed = useMemo(
    () => getDefaultTagsForFeed(effectiveFeed, replyMode, parentTags),
    [effectiveFeed, replyMode, parentTags?.join('|')],
  )
  const limit = replyMode ? REPLY_CHAR_LIMIT : FEED_CHAR_LIMITS[effectiveFeed]
  const containerRef = composeSingleFeedMode ? containerRefs?.[effectiveFeed] : null
  const hasActiveFeed = !composeSingleFeedMode || Boolean(containerRef)
  const over = body.length > limit
  const imagesInBody = extractImageUrlsFromMarkdown(body)
  const momentsSelectedNoImage = Boolean(composeSingleFeedMode && effectiveFeed === 'moments' && imagesInBody.length === 0)

  const handleSubmit = async (submittedBody: string) => {
    if (over || isSubmitting || !submittedBody.trim()) return
    if (momentsSelectedNoImage) {
      toast.error('Moments requires at least one image.')
      return
    }
    setIsSubmitting(true)
    try {
      const finalBody = submittedBody.trim()

      // Extract audio/video URLs appended by PostComposer
      const audioMatch = finalBody.match(/https?:\/\/audio\.3speak\.tv\/play\?a=[^\s]+/)
      const videoMatch = finalBody.match(/https?:\/\/play\.3speak\.tv\/(?:watch|embed)\?v=[^\s]+/)

      const audioInfo = audioMatch ? { url: audioMatch[0], duration: 0 } : null
      const videoInfo = videoMatch ? { url: videoMatch[0], uploadUrl: '', aspectRatio: '16/9' } : null

      // `tags` is the merged list emitted by PostComposer (defaults first + user additions, capped at 10).
      const effectiveTags = tags.length > 0 ? tags : defaultTagsForFeed
      const jsonMetadata = buildJsonMetadataForFeed(effectiveFeed, finalBody, effectiveTags, audioInfo, videoInfo, pollData)

      const [targetAuthor, targetPermlink] = composeSingleFeedMode && containerRef
        ? [containerRef.author, containerRef.permlink]
        : [parentAuthor!, parentPermlink!]

      if (voteEnabled) {
        await voteAndComment(targetAuthor, targetPermlink, votePercent, finalBody, '', jsonMetadata, reward)
      } else {
        await comment(targetAuthor, targetPermlink, finalBody, '', jsonMetadata, reward)
      }
      toast.success('Posted successfully!')
      setBody('')
      setPollData(null)
      onSuccess?.()
    } catch(e) {
      console.error('FeedComposer submit error:', e)
      const msg = e instanceof Error ? e.message : 'Failed to post'
      const isUserCancel = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('reject')
      if (isUserCancel) {
        toast.warning('Transaction cancelled by user')
      }
      throw e
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='p-2'>
      {/* Character count + moments warning */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs ${over ? 'text-red-400' : 'text-[#9ca3b0]'}`}>
          {body.length} / {limit}
        </span>
        {momentsSelectedNoImage && (
          <span className="text-xs text-amber-400">Moments requires at least one image</span>
        )}
      </div>

      <PostComposer
        onSubmit={handleSubmit}
        currentUser={username || undefined}
        parentAuthor={parentAuthor}
        placeholder={placeholder}
        value={body}
        onChange={setBody}
        disabled={isSubmitting || !hasActiveFeed}
        submitLabel={isSubmitting ? 'Posting…' : 'Post'}
        showCancel={false}
        hideUserHeader
        parentPermlink={parentPermlink}
        bgColor="#262b30"
        borderColor="#3a424a"
        ecencyToken={ecencyToken}
        onSignMessage={signMessage}
        signingUsername={username || undefined}
        awaitingWalletApproval={awaitingWalletApproval}
        threeSpeakApiKey={threeSpeakApiKey}
        giphyApiKey={giphyApiKey}
        templateApiBaseUrl={import.meta.env.VITE_TEMPLATE_API_BASE_URL || 'https://hreplier-api.sagarkothari88.one/data/templates'}
        templateToken={token}
        hidePoll={replyMode}
        onPollChange={(poll) => setPollData(poll)}
        defaultTags={defaultTagsForFeed}
        onTagsChange={setTags}
        defaultReward={reward}
        onRewardChange={setReward}
        showVoteButton={replyMode && !alreadyVoted}
        defaultVoteEnabled={false}
        defaultVotePercent={100}
        onVoteChange={(enabled, percent) => {
          setVoteEnabled(enabled)
          setVotePercent(percent)
        }}
      />
    </div>
  )
}
