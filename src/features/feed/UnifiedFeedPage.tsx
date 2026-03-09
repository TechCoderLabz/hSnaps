/**
 * Unified feed: 1 column (mobile), 2 columns (tablet), or 4 columns (desktop).
 * Mobile: feed switcher is in app bar (DashboardLayout); here we only show content.
 */
import { useState } from 'react'
import { useFeedColumnCount } from '../../hooks/useFeedColumnCount'
import { useMobileFeedStore } from '../../stores/mobileFeedStore'
import type { UnifiedFeedType } from '../../hooks/useFeedByType'
import { FeedSegmentControl } from '../../components/FeedSegmentControl'
import { FeedColumnContent } from '../../components/FeedColumnContent'
import { ComposeFab } from '../../components/ComposeFab'
import { FEED_LABELS, FEED_AVATARS } from '../../constants/feeds'

const COL1_OPTIONS = [
  { id: 'snaps' as const, label: FEED_LABELS.snaps, avatarUrl: FEED_AVATARS.snaps },
  { id: 'waves' as const, label: FEED_LABELS.waves, avatarUrl: FEED_AVATARS.waves },
]
const COL2_OPTIONS = [
  { id: 'threads' as const, label: FEED_LABELS.threads, avatarUrl: FEED_AVATARS.threads },
  { id: 'moments' as const, label: FEED_LABELS.moments, avatarUrl: FEED_AVATARS.moments },
]

export function UnifiedFeedPage() {
  const columns = useFeedColumnCount()
  const mobileFeed = useMobileFeedStore((s) => s.feedType)
  const [col1Feed, setCol1Feed] = useState<UnifiedFeedType>('snaps')
  const [col2Feed, setCol2Feed] = useState<UnifiedFeedType>('threads')

  if (columns === 1) {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FeedColumnContent feedType={mobileFeed} />
        </div>
        <ComposeFab feedType={mobileFeed} placeholder="What's snapping?" />
      </div>
    )
  }

  if (columns === 2) {
    return (
      <div className="grid h-full grid-cols-2 gap-4">
        <div className="flex min-h-0 flex-col">
          <div className="shrink-0 pb-2">
            <FeedSegmentControl
              options={COL1_OPTIONS}
              value={col1Feed}
              onChange={(id) => setCol1Feed(id as UnifiedFeedType)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FeedColumnContent feedType={col1Feed} />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="shrink-0 pb-2">
            <FeedSegmentControl
              options={COL2_OPTIONS}
              value={col2Feed}
              onChange={(id) => setCol2Feed(id as UnifiedFeedType)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FeedColumnContent feedType={col2Feed} />
          </div>
        </div>
        <ComposeFab feedType={col1Feed} placeholder="What's snapping?" />
      </div>
    )
  }

  // 4 columns: titles on each column, centered on wide screens
  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col">
      <div className="grid h-full min-h-0 grid-cols-4 gap-4">
        <div className="flex min-h-0 flex-col">
          <FeedColumnContent feedType="snaps" showTitle />
        </div>
        <div className="flex min-h-0 flex-col">
          <FeedColumnContent feedType="waves" showTitle />
        </div>
        <div className="flex min-h-0 flex-col">
          <FeedColumnContent feedType="threads" showTitle />
        </div>
        <div className="flex min-h-0 flex-col">
          <FeedColumnContent feedType="moments" showTitle />
        </div>
      </div>
      <ComposeFab feedType="snaps" placeholder="What's snapping?" />
    </div>
  )
}
