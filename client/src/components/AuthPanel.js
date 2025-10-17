import { useAuth } from "./AuthProvider.js"

export default function AuthPanel() {
  const { authStatus, loading, authenticate, getAuthProgress, isFullyAuthenticated } = useAuth()
  const progress = getAuthProgress()

  const providers = [
    { key: 'gmail', name: 'Gmail', color: 'from-red-500 to-red-600', icon: '📧' },
    { key: 'outlook', name: 'Outlook', color: 'from-blue-500 to-blue-600', icon: '📧' },
    { key: 'yahoo', name: 'Yahoo', color: 'from-purple-500 to-purple-600', icon: '📧' }
  ]

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🔐</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Mailbox Authentication</h3>
            <p className="text-slate-400 text-sm">Connect your email providers for real testing</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{progress.authenticated}/{progress.total}</div>
          <div className="text-sm text-slate-400">providers connected</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-slate-300 mb-3">
          <span>Authentication Progress</span>
          <span className="font-semibold">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {providers.map((provider) => {
          const isAuthenticated = authStatus[provider.key]?.authenticated
          return (
            <div 
              key={provider.key}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isAuthenticated 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{provider.name}</div>
                    <div className="text-xs text-slate-400">
                      {isAuthenticated ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                {isAuthenticated && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              
              {!isAuthenticated && (
                <button
                  onClick={() => authenticate(provider.key)}
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    loading 
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${provider.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl`
                  }`}
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Status Message */}
      {isFullyAuthenticated() ? (
        <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🎉</span>
            </div>
            <div>
              <div className="font-semibold text-green-400">All Set!</div>
              <div className="text-sm text-slate-300">You can now run comprehensive deliverability tests.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div>
              <div className="font-semibold text-amber-400">Authentication Required</div>
              <div className="text-sm text-slate-300">Connect all providers to enable real email detection.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
