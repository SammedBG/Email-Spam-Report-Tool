import { useState } from "react"

export default function InboxList({ selectedInboxes, onToggle }) {
  const inboxes = [
    { id: "gmail", name: "Gmail", icon: "📧", color: "from-red-500 to-red-600" },
    { id: "outlook", name: "Outlook", icon: "📮", color: "from-blue-500 to-blue-600" },
    { id: "yahoo", name: "Yahoo", icon: "📬", color: "from-purple-500 to-purple-600" }
  ]

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-white">Select Providers to Test</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {inboxes.map((inbox) => (
          <label
            key={inbox.id}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedInboxes.includes(inbox.id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedInboxes.includes(inbox.id)}
              onChange={() => onToggle(inbox.id)}
              className="sr-only"
            />
            <div className="text-3xl mb-2">{inbox.icon}</div>
            <div className="text-sm font-medium text-white text-center">{inbox.name}</div>
            {selectedInboxes.includes(inbox.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </label>
        ))}
      </div>
      <div className="text-xs text-slate-400 text-center">
        {selectedInboxes.length} of {inboxes.length} providers selected
      </div>
    </div>
  )
}
