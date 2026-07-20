"use client"

import { useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { authService } from "@/lib/auth-service"

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? process.env.NEXT_PUBLIC_BACKEND_URL.replace("/api", "")
  : "http://localhost:3002"

export function useSocket() {
  const qc = useQueryClient()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = authService.getToken()
    const socket = io(`${SOCKET_URL}/events`, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      auth: { token },
    })

    socket.on("connect", () => console.log("[WS] connecté"))

    socket.on("anomalie:creee", () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    })

    socket.on("demande:creee", () => {
      qc.invalidateQueries({ queryKey: ["requests"] })
      qc.invalidateQueries({ queryKey: ["pending-requests"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
    })

    socket.on("demande:traitee", () => {
      qc.invalidateQueries({ queryKey: ["requests"] })
      qc.invalidateQueries({ queryKey: ["pending-requests"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    })

    socket.on("disconnect", () => console.log("[WS] déconnecté"))

    socketRef.current = socket

    return () => { socket.disconnect() }
  }, [qc])

  return socketRef
}
