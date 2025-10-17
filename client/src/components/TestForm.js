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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Start Your Test</h2>
        <p className="text-slate-400">Enter your email and select providers to test</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-white">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        <InboxList 
          selectedInboxes={selectedInboxes} 
          onToggle={toggleInbox} 
        />

        <button
          type="submit"
          disabled={loading || selectedInboxes.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Starting Test...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>🚀</span>
              <span>Start Deliverability Test</span>
            </div>
          )}
        </button>
      </form>
    </div>
  )
}
