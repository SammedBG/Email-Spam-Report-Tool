import { Routes, Route, NavLink } from "react-router-dom"
import { AuthProvider } from "./components/AuthProvider.js"
import Home from "./pages/Home.js"
import Report from "./pages/Report.js"

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <NavLink to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📧</span>
              </div>
              <span className="text-xl font-bold text-white">Email Spam Report</span>
            </NavLink>
            <nav className="flex items-center space-x-6">
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`
                }
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

        <footer className="bg-white/5 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400 text-sm">
            <p>Built with React + Express + MongoDB • Real API integrations for Gmail, Outlook, Yahoo, iCloud, and ProtonMail</p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}