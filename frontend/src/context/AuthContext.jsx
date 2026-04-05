import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('dh_user')
      const savedToken = sessionStorage.getItem('dh_token')
      if (saved && savedToken) {
        setUser(JSON.parse(saved))
        setToken(savedToken)
      }
    } catch {}
    setLoading(false)
  }, [])

  const login = (userData, tokenStr) => {
    setUser(userData)
    setToken(tokenStr)
    sessionStorage.setItem('dh_user', JSON.stringify(userData))
    sessionStorage.setItem('dh_token', tokenStr)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem('dh_user')
    sessionStorage.removeItem('dh_token')
  }

  const userId = user?.id || 1

  return (
    <AuthContext.Provider value={{ user, token, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
