const INBOXES = [
  { provider: "Gmail", address: "deliverability.test+gmail@example.com" },
  { provider: "Outlook", address: "deliverability.test+outlook@example.com" },
  { provider: "Yahoo", address: "deliverability.test+yahoo@example.com" },
  { provider: "iCloud", address: "deliverability.test+icloud@example.com" },
  { provider: "Proton", address: "deliverability.test+proton@example.com" },
]

export default function InboxList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {INBOXES.map((i) => (
        <div key={i.provider} className="rounded-[var(--radius)] bg-slate-900/60 border border-slate-800 p-4">
          <div className="text-sm text-slate-300">{i.provider}</div>
          <div className="mt-1 text-xs text-slate-400 break-all">{i.address}</div>
        </div>
      ))}
    </div>
  )
}
