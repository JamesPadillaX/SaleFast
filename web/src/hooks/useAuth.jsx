import React, { createContext, useContext, useState, useEffect } from 'react'
import { getStoredUser, logout as apiLogout } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem('sfpos_token'))

  function login(tokenStr, userData) {
    localStorage.setItem('sfpos_token', tokenStr)
    localStorage.setItem('sfpos_user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }

  function logout() {
    apiLogout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
