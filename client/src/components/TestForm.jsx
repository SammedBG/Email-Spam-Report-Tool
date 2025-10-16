import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../utils/api.js"
import InboxList from "./InboxList.js"

export default function TestForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [instructions, setInstructions] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem("userEmail")
    if (saved) setEmail(saved)
  }, [])

  async function onStart() {
    setError("")
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.")
      return
    }
    try {
      setLoading(true)
      const res = await api.post("/api/start-test", { email })
      localStorage.setItem("userEmail", email)
      setInstructions(res.data)
      // Keep user on the same page to read instructions, but also allow navigate
    } catch (e) {
      setError("Failed to start test. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function goToReport() {
    if (instructions?.code) {
      navigate(`/report/${instructions.code}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-slate-800 p-6 bg-slate-900/60">
        <h2 className="text-lg font-semibold">Start a Deliverability Test</h2>
        <p className="text-sm text-slate-400 mt-1">Enter your email to generate a unique test code and instructions.</p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            onClick={onStart}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-brand hover:bg-brand/90 px-4 py-2 text-sm font-medium transition"
          >
            {loading ? "Generating…" : "Start Test"}
          </button>
        </div>

        {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Test Inbox Addresses</h3>
        <InboxList />
      </div>

      {instructions && (
        <div className="rounded-[var(--radius)] border border-slate-800 p-6 bg-slate-900/60 animate-in fade-in">
          <h3 className="font-semibold">Your Test Code</h3>
          <div className="mt-1 font-mono text-brand text-lg">{instructions.code}</div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>Send an email with the following:</p>
            <div className="rounded-md bg-slate-950 border border-slate-800 p-3">
              <div>
                <span className="text-slate-400">Subject:</span> {instructions.instructions.subject}
              </div>
              <div className="mt-1">
                <span className="text-slate-400">Body:</span> {instructions.instructions.body}
              </div>
            </div>
            <p className="text-slate-400">Send to these addresses:</p>
            <ul className="list-disc list-inside text-slate-300">
              {instructions.instructions.sendTo.map((i) => (
                <li key={i.provider}>
                  {i.provider}: <span className="text-slate-400">{i.address}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={goToReport}
              className="rounded-md bg-accent hover:bg-accent/90 px-4 py-2 text-sm font-medium text-slate-900 transition"
            >
              Go to Report
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin + "/report/" + instructions.code)}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm"
            >
              Copy Share Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
