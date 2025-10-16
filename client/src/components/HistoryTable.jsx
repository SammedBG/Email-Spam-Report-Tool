"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../utils/api.js"

export default function HistoryTable({ email }) {
  const [data, setData] = useState([])
  const [state, setState] = useState("idle") // idle | loading | success | error

  useEffect(() => {
    if (!email) return
    setState("loading")
    api
      .get(`/api/history/${encodeURIComponent(email)}`)
      .then((res) => {
        setData(res.data || [])
        setState("success")
      })
      .catch(() => setState("error"))
  }, [email])

  if (!email) {
    return <div className="text-sm text-slate-400">Enter your email to see past tests.</div>
  }

  if (state === "loading") {
    return <div className="text-sm text-slate-300">Loading history…</div>
  }
  if (state === "error") {
    return <div className="text-sm text-rose-300">Failed to load history.</div>
  }
  if (!data.length) {
    return <div className="text-sm text-slate-400">No tests found for {email}.</div>
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/60">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">Code</th>
            <th className="px-4 py-2 font-medium">Score</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Report</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.code} className="border-t border-slate-800">
              <td className="px-4 py-2 font-mono">{row.code}</td>
              <td className="px-4 py-2">{row.score}%</td>
              <td className="px-4 py-2 capitalize">{row.status}</td>
              <td className="px-4 py-2">{new Date(row.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2">
                <Link className="text-brand hover:underline" to={`/report/${row.code}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
