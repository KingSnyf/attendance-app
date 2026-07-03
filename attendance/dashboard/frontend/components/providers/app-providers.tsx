"use client"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/hooks/useAuth"

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
  )
}

export { AppProviders }
