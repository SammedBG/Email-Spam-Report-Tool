import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../utils/api.js"
import { useAuth } from "../components/AuthProvider.js"
import ProgressBar from "../components/ProgressBar.js"
import ResultCard from "../components/ResultCard.js"

export default function Report() {
  const { code } = useParams()
  const { getTokens, isFullyAuthenticated } = useAuth()
  const [state, setState] = useState("idle") // idle | loading | success | error
  const [data, setData] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setState("loading")
    setProgress(20)
    const t1 = setTimeout(() => setProgress(55), 500)
    const t2 = setTimeout(() => setProgress(85), 1000)

    // Use real API integration with OAuth tokens
    const tokens = getTokens()
    api
      .post(`/api/check/${encodeURIComponent(code)}`, { tokens })
      .then((res) => {
        setData(res.data)
        setState("success")
        setProgress(100)
      })
      .catch(() => {
        setState("error")
      })
      .finally(() => {
        clearTimeout(t1)
        clearTimeout(t2)
      })
  }, [code, getTokens])

  const shareUrl = useMemo(() => `${window.location.origin}/report/${code}`, [code])

  function downloadPdf() {
    window.open(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/report/${code}/pdf`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Report</h1>
          <div className="text-slate-400 text-sm">
            Code: <span className="font-mono">{code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-green-600 hover:bg-green-700 px-3 py-2 text-sm font-medium text-white"
          >
            🔄 Check Results
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="rounded-md border border-slate-700 px-3 py-2 text-sm"
          >
            Copy Share Link
          </button>
          <button onClick={downloadPdf} className="rounded-md bg-brand hover:bg-brand/90 px-3 py-2 text-sm font-medium">
            Download PDF
          </button>
        </div>
      </div>

      {!isFullyAuthenticated() && (
        <div className="rounded-md border border-amber-900 bg-amber-950/50 p-4 text-amber-300">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-sm font-medium">Authentication Required</span>
          </div>
          <p className="text-sm mt-1">
            You need to authenticate with all mailbox providers to enable real email detection. 
            Go back to the home page and connect your accounts.
          </p>
        </div>
      )}

      {state === "loading" && (
        <div className="space-y-6">
          <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-6">
            <div className="text-center">
              <div className="text-blue-300 text-lg font-semibold mb-2">Checking Inbox Placements</div>
              <div className="text-slate-300 mb-4">Scanning Gmail, Outlook, and Yahoo inboxes for your test email...</div>
              <ProgressBar value={progress} />
            </div>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-md border border-rose-900 bg-rose-950/50 p-4 text-rose-300">
          Failed to load report. The test code may be invalid.
        </div>
      )}

      {state === "success" && data && (
        <div className="space-y-8">
          <div className="rounded-[var(--radius)] border border-slate-800 p-6 bg-slate-900/60">
            <div className="text-sm text-slate-300 mb-2">Overall Deliverability Score</div>
            <div className="text-3xl font-bold">{data.score}%</div>
            <div className="text-xs text-slate-400">Based on placement across 3 major email providers</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.result.map((r) => (
              <ResultCard key={r.provider} provider={r.provider} placement={r.placement} />
            ))}
          </div>

          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
            <div className="text-sm text-slate-300 mb-2">Test Information</div>
            <div className="text-xs text-slate-400">
              Test Code: <span className="font-mono text-white">{data.code}</span>
            </div>
            <div className="text-xs text-slate-400">
              Created: {new Date(data.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
