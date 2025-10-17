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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">
              Email Deliverability
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Made Simple
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Test your email deliverability across Gmail, Outlook, and Yahoo. 
              Get instant insights and improve your email performance.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Real API Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>3 Major Providers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <AuthPanel />

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
          <TestForm />
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Test History</h2>
          </div>
          <HistoryTable email={email} />
        </div>
      </div>
    </div>
  )
}
