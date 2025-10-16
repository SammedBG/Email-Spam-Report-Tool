import { Routes, Route, NavLink } from "react-router-dom"
import { AuthProvider } from "./components/AuthProvider.jsx"
import Home from "./pages/Home.jsx"
import Report from "./pages/Report.jsx"

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-full flex flex-col">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <NavLink to="/" className="text-lg font-semibold text-white">
              Email Spam Report
            </NavLink>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) => `hover:text-white ${isActive ? "text-white" : "text-slate-300"}`}
              >
                Home
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:code" element={<Report />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400">
            Built with React + Express + MongoDB. Real API integrations for Gmail, Outlook, Yahoo, iCloud, and ProtonMail.
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
