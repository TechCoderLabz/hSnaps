/** Placeholder for Search User, Ignored, Settings until real pages exist. */
interface PlaceholderPageProps {
  title: string
  icon?: React.ReactNode
}

export function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon}
      <h1 className="text-lg font-semibold text-[#f0f0f8]">{title}</h1>
      <p className="text-sm text-[#9ca3b0]">Coming soon.</p>
    </div>
  )
}
