"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Spinner } from "@/components/ui/spinner"
import { authService } from "@/lib/auth-service"

const ROLES_AUTHORISES = ["admin", "gestionnaire"]

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  const checkAuth = useCallback(() => {
    const user = authService.getUser()
    if (!user || !ROLES_AUTHORISES.includes(user.role)) {
      authService.logout()
      router.replace("/auth")
    } else {
      setAuthorized(true)
    }
  }, [router])

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    const onFocus = () => { if (!authService.getToken()) router.replace("/auth") }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [router])

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="sticky top-0 h-screen shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

export { DashboardShell }
