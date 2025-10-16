import { useState } from "react"

export default function InboxList({ selectedInboxes, onToggle }) {
  const inboxes = [
    { id: "gmail", name: "Gmail", icon: "📧" },
    { id: "outlook", name: "Outlook", icon: "📮" },
    { id: "yahoo", name: "Yahoo", icon: "📬" },
    { id: "icloud", name: "iCloud", icon: "☁️" },
    { id: "proton", name: "ProtonMail", icon: "🔒" }
  ]

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-300">Select Inboxes to Test</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {inboxes.map((inbox) => (
          <label
            key={inbox.id}
            className="flex items-center gap-2 p-3 rounded-md border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedInboxes.includes(inbox.id)}
              onChange={() => onToggle(inbox.id)}
              className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-lg">{inbox.icon}</span>
            <span className="text-sm text-slate-300">{inbox.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
