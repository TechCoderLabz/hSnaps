/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'
import { ThumbsUp, MessageSquare, MoreHorizontal, Clock } from 'lucide-react'
import { DefaultRenderer } from '@hiveio/content-renderer'
import { formatDistanceToNow } from 'date-fns'
import type { Discussion } from '../../utils/commentTypes'
import { VoteSlider } from './VoteSlider'

interface CommentTileProps {
  comment: Discussion
  allComments: Discussion[]
  onReply: (author: string, permlink: string) => void
  currentUser?: string
  searchQuery?: string
  depth?: number
  onVotedRefresh?: () => void
  onClickCommentUpvote?: (author: string, permlink: string, percent: number) => void | Promise<void>
  onClickCommentReply?: (comment: Discussion) => void
  onClickUpvoteButton?: (currentUser?: string) => void
}

export function CommentTile({
  comment,
  allComments,
  onReply,
  currentUser,
  searchQuery,
  depth = 0,
  onVotedRefresh,
  onClickCommentUpvote,
  onClickCommentReply,
  onClickUpvoteButton,
}: CommentTileProps) {
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [showVoteSlider, setShowVoteSlider] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const hasAlreadyVoted = useMemo(() => {
    const activeVotes = comment.active_votes || []
    if (!currentUser) return false
    const user = currentUser.toLowerCase()
    return activeVotes.some((v: { voter?: string }) => (v.voter || '').toLowerCase() === user)
  }, [comment.active_votes, currentUser])

  const parentDepth = comment.depth || 0
  const directReplies = allComments.filter(
    (c) =>
      c.parent_author === comment.author &&
      c.parent_permlink === comment.permlink &&
      (typeof c.depth !== 'number' || c.depth === parentDepth + 1)
  )

  let replies = directReplies
  if ((!replies || replies.length === 0) && Array.isArray(comment.replies) && comment.replies.length > 0) {
    const replyKeys = new Set(comment.replies as string[])
    replies = allComments.filter((c) => replyKeys.has(`${c.author}/${c.permlink}`))
  }

  const hasReplies = replies.length > 0
  const isMaxDepth = depth >= 4

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 2500)
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-300/40">$1</mark>')
  }

  const handleOpenVote = () => {
    setShowVoteSlider(true)
  }

  const handlePerformUpvote = async (percent: number) => {
    if (!onClickCommentUpvote) {
      onClickUpvoteButton?.(currentUser)
      return
    }
    try {
      await Promise.resolve(onClickCommentUpvote(comment.author, comment.permlink, percent))
      setIsUpvoted(true)
      setShowVoteSlider(false)
      setIsRefreshing(true)
      setTimeout(() => {
        onVotedRefresh?.()
        setIsRefreshing(false)
        showToast('Vote submitted successfully!')
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upvote'
      showToast(message)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReplyClick = () => {
    if (onClickCommentReply) {
      onClickCommentReply(comment)
    } else {
      if (currentUser) {
        onReply(comment.author, comment.permlink)
      } else {
        showToast('Please login to reply')
      }
    }
  }

  const metadata =
    (comment as unknown as { json_metadata_parsed?: any; json_metadata?: string }).json_metadata_parsed ||
    (() => {
      try {
        return comment.json_metadata ? JSON.parse(comment.json_metadata) : undefined
      } catch {
        return undefined
      }
    })()

  const rawBody = comment.body || ''
  const sanitizeHashtagBlock = (text: string) => {
    const pattern = /^(\s*(?:#[\p{L}\p{N}_-]+\s*(?:,\s*)?)+\s*)$/gimu
    return text.replace(pattern, '').trim()
  }
  const sanitizedBody = sanitizeHashtagBlock(rawBody)

  const displayBody = searchQuery ? highlightText(sanitizedBody, searchQuery) : sanitizedBody

  const hasMarkdownImagesInBody =
    /!\[[^\]]*\]\([^)]+\)/.test(sanitizedBody) || /<img\s/i.test(sanitizedBody)
  const metadataImages: string[] = Array.isArray(metadata?.image) ? metadata.image : []

  const hiveRenderer = new DefaultRenderer({
    baseUrl: 'https://hive.blog/',
    breaks: true,
    skipSanitization: false,
    allowInsecureScriptTags: false,
    addNofollowToLinks: true,
    doNotShowImages: false,
    assetsWidth: 640,
    assetsHeight: 480,
    imageProxyFn: (url: string) => url,
    usertagUrlFn: (account: string) => `/@${account}`,
    hashtagUrlFn: (hashtag: string) => `/trending/${hashtag}`,
    isLinkSafeFn: () => true,
    addExternalCssClassToMatchingLinksFn: () => true,
    ipfsPrefix: 'https://ipfs.io/ipfs/',
  })

  const voteCount = comment.stats?.total_votes || comment.net_votes || 0

  return (
    <div
      className={
        depth > 0
          ? 'ml-4 border-l-2 border-[#3a424a] pl-4 md:ml-8 md:pl-6'
          : ''
      }
    >
      <div className="group p-4 transition-colors duration-200 hover:bg-[#262b30] md:p-6">
        <div className="flex items-start space-x-3 md:space-x-4">
          <div className="flex-shrink-0">
            <img
              src={`https://images.hive.blog/u/${comment.author}/avatar`}
              alt={comment.author}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#3a424a] md:h-10 md:w-10"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${comment.author}&background=random`
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="text-sm font-semibold text-zinc-50 transition-colors duration-200 hover:text-[#e31337] md:text-base"
              >
                @{comment.author}
              </button>
              {comment.created && (
                <div className="flex items-center space-x-1 text-xs text-zinc-400 md:text-sm">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>
                    {formatDistanceToNow(new Date(`${comment.created}Z`), { addSuffix: true })}
                  </span>
                </div>
              )}
              {comment.author === currentUser && (
                <span className="rounded-full bg-[#e31337]/10 px-2 py-1 text-xs text-[#ffb5c2]">
                  You
                </span>
              )}
            </div>

            <div className="comment-content prose prose-sm max-w-none text-left text-zinc-50 prose-a:text-[#ffb5c2] prose-a:underline dark:prose-invert md:prose-base [&_*]:text-left">
              {searchQuery ? (
                <div
                  className="text-left"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: displayBody }}
                />
              ) : (
                <div
                  className="text-left"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: hiveRenderer.render(sanitizedBody) }}
                />
              )}
            </div>

            {!hasMarkdownImagesInBody && metadataImages.length > 0 && (
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metadataImages.map((src, idx) => (
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt={`image-${idx}`}
                    className="h-auto max-w-full cursor-pointer rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md"
                    onClick={() => window.open(src, '_blank')}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center space-x-4 md:space-x-6">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    showToast('Please login to upvote')
                    return
                  }
                  if (hasAlreadyVoted || isUpvoted) {
                    showToast('You have already upvoted this comment')
                    return
                  }
                  handleOpenVote()
                }}
                className={`flex items-center space-x-2 text-xs font-medium transition-colors duration-200 md:text-sm ${
                  isUpvoted || hasAlreadyVoted
                    ? 'text-[#e31337]'
                    : 'text-zinc-400 hover:text-[#e31337]'
                }`}
              >
                <ThumbsUp
                  className={`h-4 w-4 ${
                    hasAlreadyVoted || isUpvoted ? 'text-[#e31337]' : ''
                  }`}
                />
                <span>{voteCount}</span>
              </button>

              <button
                type="button"
                onClick={handleReplyClick}
                className="flex items-center space-x-2 text-xs font-medium text-zinc-400 transition-colors duration-200 hover:text-[#e31337] md:text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Reply</span>
              </button>

              {hasReplies && (
                <button
                  type="button"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs font-medium text-zinc-400 transition-colors duration-200 hover:text-[#e31337] md:text-sm"
                >
                  {showReplies ? 'Hide' : 'Show'} {replies.length}{' '}
                  {replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onClickCommentReply?.(comment)}
                className="opacity-0 transition-all duration-200 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            {showVoteSlider && !hasAlreadyVoted && (
              <div className="mt-3">
                <VoteSlider
                  author={comment.author}
                  permlink={comment.permlink}
                  onUpvote={handlePerformUpvote}
                  onCancel={() => setShowVoteSlider(false)}
                />
              </div>
            )}

            {isRefreshing && (
              <div className="mt-3 inline-flex items-center text-xs text-zinc-400">
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#e31337] border-t-transparent" />
                Updating votes...
              </div>
            )}
            {toastOpen && (
              <div className="fixed bottom-4 right-4 z-50 w-[280px]">
                <div className="rounded bg-zinc-900 px-3 py-2 text-sm text-zinc-50 shadow-lg">
                  {toastMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasReplies && showReplies && !isMaxDepth && (
        <div className="space-y-0">
          {replies.map((reply) => (
            <CommentTile
              // eslint-disable-next-line react/no-array-index-key
              key={`${reply.author}/${reply.permlink}`}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              currentUser={currentUser}
              searchQuery={searchQuery}
              depth={depth + 1}
              onVotedRefresh={onVotedRefresh}
              onClickCommentUpvote={onClickCommentUpvote}
              onClickCommentReply={onClickCommentReply}
              onClickUpvoteButton={onClickUpvoteButton}
            />
          ))}
        </div>
      )}

      {hasReplies && isMaxDepth && (
        <div className="ml-4 border-l-2 border-[#3a424a] pl-4 text-sm text-zinc-400 md:ml-8 md:pl-6">
          <button
            type="button"
            className="text-[#e31337] hover:underline"
            onClick={() => {
              // Could be extended to open a dedicated replies view
              console.log('Show more replies for:', comment.author, comment.permlink)
            }}
          >
            View {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      )}
    </div>
  )
}

