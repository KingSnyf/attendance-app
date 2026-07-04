"use client"
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { authService } from "@/lib/auth-service"
import { api } from "@/lib/api"

type User = {
  id: string
  email: string
  role: string
  prenom: string
  nom: string
  photo_url?: string | null
}

type LoginParams = { email: string; password: string }
type RegisterParams = { email: string; password: string; firstName: string; lastName: string; role: string }

type AuthContextType = {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (params: LoginParams) => Promise<{ success: boolean; user?: User; error?: string }>
  register: (params: RegisterParams) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getUser())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async ({ email, password }: LoginParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: err.message || "Identifiants invalides" }
      }
      const data = await res.json()
      authService.setToken(data.access_token)
      const userData: User = { id: data.user.id, email: data.user.email, role: data.user.role, prenom: data.user.prenom, nom: data.user.nom }
      authService.setUser(userData)
      setUser(userData)
      return { success: true, user: userData }
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async ({ email, password, firstName, lastName, role }: RegisterParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nom: lastName, prenom: firstName, role }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: err.message || "Erreur d'inscription" }
      }
      return { success: true }
    } catch {
      return { success: false, error: "Erreur de connexion au serveur" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    window.location.replace("/auth")
  }, [])

  const refreshUser = useCallback(async () => {
    const token = authService.getToken()
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const userData: User = { id: data.id, email: data.email, role: data.role, prenom: data.prenom, nom: data.nom, photo_url: data.photo_url }
        authService.setUser(userData)
        setUser(userData)
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export { AuthProvider, useAuth }
