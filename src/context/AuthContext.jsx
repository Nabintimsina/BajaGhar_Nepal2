import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearAuthToken, getAuthToken, setAuthToken } from '../api/client'

const AuthContext = createContext({
  user: null,
  expert: null,
  isExpert: false,
  subscription: { plan: 'FREE', is_premium: false },
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [expert, setExpert] = useState(null)
  const [subscription, setSubscription] = useState({ plan: 'FREE', is_premium: false })
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!getAuthToken()) {
      setUser(null)
      setExpert(null)
      setSubscription({ plan: 'FREE', is_premium: false })
      setLoading(false)
      return null
    }

    try {
      const data = await api.get('auth/me/')
      setUser(data?.user || null)
      setExpert(data?.expert || null)
      setSubscription(data?.subscription || { plan: 'FREE', is_premium: false })
      return data
    } catch {
      clearAuthToken()
      localStorage.removeItem('refresh_token')
      setUser(null)
      setExpert(null)
      setSubscription({ plan: 'FREE', is_premium: false })
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  const login = async (payload) => {
    const data = await api.post('auth/token/', payload)
    if (data?.access) {
      setAuthToken(data.access)
      localStorage.setItem('refresh_token', data.refresh || '')
    }
    const profile = await refreshProfile()
    return profile
  }

  const register = async (payload) => {
    const data = await api.post('auth/register/', payload)
    if (data?.access) {
      setAuthToken(data.access)
      localStorage.setItem('refresh_token', data.refresh || '')
    }
    const profile = await refreshProfile()
    return profile
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) {
        await api.post('auth/logout/', { refresh })
      }
    } catch {
      // ignore logout errors and continue gracefully
    } finally {
      clearAuthToken()
      localStorage.removeItem('refresh_token')
      setUser(null)
      setExpert(null)
      setSubscription({ plan: 'FREE', is_premium: false })
    }
  }

  const value = useMemo(() => ({
    user,
    expert,
    isExpert: Boolean(expert),
    subscription,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    refreshProfile
  }), [user, expert, subscription, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
