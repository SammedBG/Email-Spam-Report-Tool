import { useAuth } from "./AuthProvider.js"

export default function AuthPanel() {
  const { authStatus, loading, authenticate, getAuthProgress, isFullyAuthenticated } = useAuth()
  const progress = getAuthProgress()

  const providers = [
    { key: 'gmail', name: 'Gmail', color: 'bg-red-500', icon: '📧' },
    { key: 'outlook', name: 'Outlook', color: 'bg-blue-500', icon: '📧' },
    { key: 'yahoo', name: 'Yahoo', color: 'bg-purple-500', icon: '📧' },
    { key: 'icloud', name: 'iCloud', color: 'bg-gray-500', icon: '☁️' },
    { key: 'proton', name: 'ProtonMail', color: 'bg-yellow-500', icon: '🔒' }
  ]

  return (
    <div className="rounded-[var(--radius)] border border-slate-800 p-6 bg-slate-900/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Mailbox Authentication</h3>
        <div className="text-sm text-slate-400">
          {progress.authenticated}/{progress.total} providers connected
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>Authentication Progress</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div 
            className="bg-brand h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Provider Status */}
      <div className="space-y-3">
        {providers.map((provider) => {
          const isAuthenticated = authStatus[provider.key]?.authenticated
          return (
            <div 
              key={provider.key}
              className={`flex items-center justify-between p-3 rounded-md border ${
                isAuthenticated 
                  ? 'border-green-800 bg-green-950/20' 
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{provider.icon}</span>
                <div>
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-xs text-slate-400">
                    {isAuthenticated ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <span className="text-sm">✓</span>
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={() => authenticate(provider.key)}
                    disabled={loading}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      loading 
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : `${provider.color} hover:opacity-90 text-white`
                    }`}
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Status Message */}
      {isFullyAuthenticated() ? (
        <div className="mt-4 p-3 bg-green-950/20 border border-green-800 rounded-md">
          <div className="flex items-center gap-2 text-green-400">
            <span>🎉</span>
            <span className="text-sm font-medium">All providers connected! You can now run deliverability tests.</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800 rounded-md">
          <div className="flex items-center gap-2 text-amber-400">
            <span>⚠️</span>
            <span className="text-sm">Connect all providers to enable real email detection.</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-slate-400">
        <p>• Click "Connect" to authenticate with each mailbox provider</p>
        <p>• You'll be redirected to the provider's OAuth page</p>
        <p>• Grant permission to read your mailbox for deliverability testing</p>
      </div>
    </div>
  )
}
