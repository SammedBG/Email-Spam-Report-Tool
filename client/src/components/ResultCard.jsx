function Badge({ placement }) {
  const map = {
    Inbox: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    Promotions: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    Spam: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${map[placement] || ""}`}>
      {placement}
    </span>
  )
}

export default function ResultCard({ provider, placement }) {
  return (
    <div className="rounded-[var(--radius)] bg-slate-900/60 border border-slate-800 p-4 transition-transform duration-300 hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <div className="font-medium">{provider}</div>
        <Badge placement={placement} />
      </div>
    </div>
  )
}
