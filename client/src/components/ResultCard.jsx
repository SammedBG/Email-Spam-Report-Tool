export default function ResultCard({ provider, placement }) {
  const getPlacementColor = (placement) => {
    switch (placement) {
      case "Inbox":
        return "text-green-400 bg-green-950/50 border-green-900"
      case "Promotions":
        return "text-yellow-400 bg-yellow-950/50 border-yellow-900"
      case "Spam":
        return "text-red-400 bg-red-950/50 border-red-900"
      default:
        return "text-slate-400 bg-slate-950/50 border-slate-900"
    }
  }

  const getProviderIcon = (provider) => {
    switch (provider.toLowerCase()) {
      case "gmail":
        return "📧"
      case "outlook":
        return "📮"
      case "yahoo":
        return "📬"
      case "icloud":
        return "☁️"
      case "proton":
        return "🔒"
      default:
        return "📧"
    }
  }

  return (
    <div className="rounded-md border border-slate-800 p-4 bg-slate-900/60">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{getProviderIcon(provider)}</span>
        <div className="font-medium text-slate-200">{provider}</div>
      </div>
      <div
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPlacementColor(
          placement
        )}`}
      >
        {placement}
      </div>
    </div>
  )
}
