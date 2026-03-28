import React, { createContext, useContext } from "react"

interface AuthContextType {
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({ isAdmin: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ isAdmin: true }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
