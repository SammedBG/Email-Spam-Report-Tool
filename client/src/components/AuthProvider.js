import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../utils/api.js"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [authStatus, setAuthStatus] = useState({})
  const [loading, setLoading] = useState(false)

  const providers = ['gmail', 'outlook', 'yahoo', 'icloud', 'proton']

  // Check authentication status for all providers
  const checkAuthStatus = async () => {
    try {
      const status = {}
      for (const provider of providers) {
        const tokens = localStorage.getItem(`${provider}_tokens`)
        status[provider] = {
          authenticated: !!tokens,
          tokens: tokens ? JSON.parse(tokens) : null
        }
      }
      setAuthStatus(status)
    } catch (error) {
      console.error('Error checking auth status:', error)
    }
  }

  // Authenticate with a specific provider
  const authenticate = async (provider) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/auth/${provider}`)
      const { authUrl } = response.data
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        `${provider}_oauth`,
        'width=600,height=600,scrollbars=yes,resizable=yes'
      )

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setLoading(false)
          checkAuthStatus() // Refresh auth status
        }
      }, 1000)

    } catch (error) {
      console.error(`Authentication error for ${provider}:`, error)
      setLoading(false)
    }
  }

  // Handle OAuth callback (called from popup)
  const handleCallback = async (provider, code) => {
    try {
      const response = await api.get(`/api/auth/${provider}/callback?code=${code}`)
      const { tokens } = response.data
      
      // Store tokens
      localStorage.setItem(`${provider}_tokens`, JSON.stringify(tokens))
      
      // Update auth status
      setAuthStatus(prev => ({
        ...prev,
        [provider]: {
          authenticated: true,
          tokens
        }
      }))

      // Close popup
      window.close()
    } catch (error) {
      console.error(`Callback error for ${provider}:`, error)
    }
  }

  // Get tokens for API calls
  const getTokens = () => {
    const tokens = {}
    providers.forEach(provider => {
      const tokenData = authStatus[provider]?.tokens
      if (tokenData) {
        tokens[provider] = tokenData
      }
    })
    return tokens
  }

  // Check if all providers are authenticated
  const isFullyAuthenticated = () => {
    return providers.every(provider => authStatus[provider]?.authenticated)
  }

  // Get authentication progress
  const getAuthProgress = () => {
    const authenticated = providers.filter(provider => authStatus[provider]?.authenticated).length
    return {
      authenticated,
      total: providers.length,
      percentage: Math.round((authenticated / providers.length) * 100)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value = {
    authStatus,
    loading,
    authenticate,
    handleCallback,
    getTokens,
    isFullyAuthenticated,
    getAuthProgress,
    providers
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
