import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, userAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('deltaedge_token')
    const savedUser  = localStorage.getItem('deltaedge_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { jwt, ...userData } = res.data
    localStorage.setItem('deltaedge_token', jwt)
    localStorage.setItem('deltaedge_user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* ignore */ }
    localStorage.removeItem('deltaedge_token')
    localStorage.removeItem('deltaedge_user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await userAPI.getProfile()
      setUser(res.data)
      localStorage.setItem('deltaedge_user', JSON.stringify(res.data))
    } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
