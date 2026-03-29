import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { setAuthTokenGetter } from "@workspace/api-client-react"

export type UserRole = "admin" | "manager" | "resident"

export interface AuthUser {
  id: number
  username: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (role: UserRole, username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isManager: boolean
  isResident: boolean
  canWrite: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
  isManager: false,
  isResident: false,
  canWrite: false,
})

const TOKEN_KEY = "messmate_token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthTokenGetter(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY))
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((u: AuthUser) => {
        setUser(u)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setAuthTokenGetter(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (role: UserRole, username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, username, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Login failed")
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY))
    setUser({ id: 0, username: data.username, role: data.role })
  }, [])

  const isAdmin = user?.role === "admin"
  const isManager = user?.role === "manager"
  const isResident = user?.role === "resident"
  const canWrite = isAdmin || isManager

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, isManager, isResident, canWrite }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
