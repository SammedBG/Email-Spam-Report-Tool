export default function ProgressBar({ value }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-brand transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
