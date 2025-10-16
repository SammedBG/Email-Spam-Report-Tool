import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../utils/api.js"

export default function HistoryTable({ email }) {
  const [data, setData] = useState([])

  useEffect(() => {
    if (email) {
      api.get("/api/history").then((res) => setData(res.data))
    }
  }, [email])

  return (
    <div className="rounded-md border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((item) => (
              <tr key={item.code} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-sm font-mono text-slate-300">
                  {item.code}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                    {item.score}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'completed' 
                      ? 'bg-green-900/50 text-green-400' 
                      : item.status === 'processing'
                      ? 'bg-yellow-900/50 text-yellow-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    to={`/report/${item.code}`}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="px-4 py-8 text-center text-slate-400">
          No tests found. Create your first test above.
        </div>
      )}
    </div>
  )
}
