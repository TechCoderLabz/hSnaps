/**
 * Segment control (pill switcher) for 2 or 4 feed options.
 */
interface Option {
  id: string
  label: string
  avatarUrl?: string
}

interface FeedSegmentControlProps {
  options: Option[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function FeedSegmentControl({
  options,
  value,
  onChange,
  className = '',
}: FeedSegmentControlProps) {
  return (
    <div
      className={`inline-flex rounded-lg border border-[#3a424a] bg-[#262b30] p-0.5 ${className}`}
      role="tablist"
      aria-label="Feed"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.id
              ? 'bg-[#e31337] text-white'
              : 'text-[#9ca3b0] hover:text-[#f0f0f8]'
          }`}
        >
          {opt.avatarUrl && (
            <img
              src={opt.avatarUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
