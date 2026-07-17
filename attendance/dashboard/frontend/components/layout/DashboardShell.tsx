"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Spinner } from "@/components/ui/spinner"
import { authService } from "@/lib/auth-service"
import { api, ROLES_AUTHORISES } from "@/lib/api"

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [refused, setRefused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const checkAuth = useCallback(async () => {
    const user = authService.getUser()
    if (!user) {
      router.replace("/auth")
      return
    }
    if (!ROLES_AUTHORISES.includes(user.role)) {
      setRefused(true)
      return
    }
    try {
      await api.getUser()
      setAuthorized(true)
    } catch {
      authService.logout()
      router.replace("/auth")
    }
  }, [router])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    const onFocus = () => { if (!authService.getToken()) router.replace("/auth") }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [router])

  if (refused) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Accès restreint</h1>
        <p className="text-muted-foreground">Le tableau de bord est réservé aux administrateurs et gestionnaires.</p>
        <button onClick={() => { authService.logout(); router.replace("/auth") }} className="text-sm text-brand hover:underline">
          Se connecter avec un autre compte
        </button>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className={`fixed inset-0 z-30 bg-black/40 lg:static lg:z-auto lg:bg-transparent ${sidebarOpen ? "block" : "hidden lg:block"}`} onClick={() => setSidebarOpen(false)} />
      <div className={`fixed inset-y-0 left-0 z-40 h-screen shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export { DashboardShell }
