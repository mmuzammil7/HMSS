import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

interface AuthContextType {
  isAdmin: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  login: () => {},
  logout: () => {},
})

const STORAGE_KEY = "mess_admin_authed"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  const login = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "1")
    setIsAdmin(true)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
