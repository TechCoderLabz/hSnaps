/** Skeleton loader for feed cards */
export function FeedSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-zinc-700" />
          <div className="h-3 w-full max-w-md rounded bg-zinc-700" />
          <div className="h-3 w-2/3 rounded bg-zinc-700" />
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-12 rounded bg-zinc-700" />
            <div className="h-3 w-16 rounded bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  )
}
