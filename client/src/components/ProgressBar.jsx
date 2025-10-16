export default function ProgressBar({ value = 0, max = 100 }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}