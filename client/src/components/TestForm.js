import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../utils/api.js"
import InboxList from "./InboxList.js"

export default function TestForm() {
  const [email, setEmail] = useState("")
  const [selectedInboxes, setSelectedInboxes] = useState(["gmail", "outlook", "yahoo", "icloud", "proton"])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem("userEmail")
    if (saved) setEmail(saved)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      localStorage.setItem("userEmail", email)
      const res = await api.post("/api/start", {
        email,
        inboxes: selectedInboxes
      })
      navigate(`/report/${res.data.code}`)
    } catch (error) {
      console.error("Failed to start test:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInbox = (inboxId) => {
    setSelectedInboxes(prev => 
      prev.includes(inboxId) 
        ? prev.filter(id => id !== inboxId)
        : [...prev, inboxId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Your Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <InboxList 
          selectedInboxes={selectedInboxes} 
          onToggle={toggleInbox} 
        />
      </div>

      <button
        type="submit"
        disabled={loading || selectedInboxes.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
      >
        {loading ? "Starting Test..." : "Start Deliverability Test"}
      </button>
    </form>
  )
}
