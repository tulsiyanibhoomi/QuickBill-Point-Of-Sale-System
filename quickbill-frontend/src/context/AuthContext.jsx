import { createContext, useContext, useState, useEffect } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('qb_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = (token, userData) => {
    localStorage.setItem('qb_token', token)
    localStorage.setItem('qb_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('qb_token')
    localStorage.removeItem('qb_user')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, isOwner: user?.role === 'owner' }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
