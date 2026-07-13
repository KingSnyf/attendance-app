"use client"
import { useRef } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/hooks/useAuth"
import { useSocket } from "@/lib/hooks/use-socket"

function SocketInit() {
  useSocket()
  return null
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClientRef = useRef<QueryClient>(null)
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 2,
          refetchOnWindowFocus: false,
        },
      },
    })
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AuthProvider>
        <SocketInit />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export { AppProviders }
