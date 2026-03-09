/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react'
import { ThumbsUp, MessageSquare, Clock } from 'lucide-react'
import { AddBookmarkButton } from '../AddBookmarkButton'
import { FeedItemOptions } from '../FeedItemOptions'
import { formatDistanceToNow } from 'date-fns'
import type { Discussion } from '../../utils/commentTypes'
import { parseBodyFromMarkdown } from '../../utils/postBody'
import { contentHas3SpeakEmbed } from '../../utils/3speak'
import { VoteSlider } from './VoteSlider'
import { ParsedBodyContent } from '../FeedItemBody'

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
  /** Called after reporting a comment author (e.g. to refetch comments). */
  onReportedAuthor?: (username: string) => void
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
  onReportedAuthor,
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

  const parsedBody = useMemo(
    () => parseBodyFromMarkdown(comment.body ?? '', comment.json_metadata),
    [comment.body, comment.json_metadata]
  )
  const hideImages = contentHas3SpeakEmbed(comment.body ?? '', comment.json_metadata)
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
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
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
              <FeedItemOptions
                targetUsername={comment.author}
                targetPermlink={comment.permlink}
                onReportedAuthor={onReportedAuthor}
                className="shrink-0"
                ariaLabel="Comment options"
              />
            </div>

            <div className="comment-content text-left text-zinc-50">
              <ParsedBodyContent
                parsed={parsedBody}
                hideImages={hideImages}
                highlightQuery={searchQuery}
              />
            </div>

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

              <AddBookmarkButton
                author={comment.author}
                permlink={comment.permlink}
                title={comment.title ?? ''}
                body={comment.body ?? ''}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors duration-200 hover:bg-[#2f353d] hover:text-[#e31337]"
                ariaLabel="Add to bookmarks"
              />

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
              onReportedAuthor={onReportedAuthor}
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

