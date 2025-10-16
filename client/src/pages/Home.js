import { useEffect, useState } from "react"
import TestForm from "../components/TestForm.js"
import HistoryTable from "../components/HistoryTable.js"
import AuthPanel from "../components/AuthPanel.js"

export default function Home() {
  const [email, setEmail] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("userEmail")
    if (saved) setEmail(saved)
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance">Email Deliverability & Spam Report</h1>
        <p className="text-slate-400 text-pretty">
          Generate a unique test, send emails to our test inboxes, and view your placement across providers.
        </p>
      </section>

      <AuthPanel />

      <TestForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Past Tests</h2>
        <HistoryTable email={email} />
      </section>
    </div>
  )
}
