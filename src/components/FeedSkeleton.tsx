/** Skeleton loader for feed cards — matches PostCard structure. */
export function FeedSkeleton() {
  return (
    <div className="animate-pulse break-inside-avoid rounded-2xl border border-[#3a424a] bg-[#262b30]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-0">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[#3a424a]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-[#3a424a]" />
        </div>
      </div>
      <div className="space-y-2 px-4 pt-3 pb-3">
        <div className="h-3 w-full rounded bg-[#3a424a]" />
        <div className="h-3 w-4/5 rounded bg-[#3a424a]" />
        <div className="h-3 w-2/3 rounded bg-[#3a424a]" />
      </div>
      <div className="flex gap-3 border-t border-[#3a424a]/60 px-4 py-2.5">
        <div className="h-3 w-10 rounded bg-[#3a424a]" />
        <div className="h-3 w-10 rounded bg-[#3a424a]" />
        <div className="h-3 w-10 rounded bg-[#3a424a]" />
      </div>
    </div>
  )
}
