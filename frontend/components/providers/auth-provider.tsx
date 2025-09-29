"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadUser, isAuthenticated } = useAuth()

  useEffect(() => {
    // Cargar usuario al inicializar la app si hay token
    const token = localStorage.getItem("auth_token")
    if (token && !isAuthenticated) {
      loadUser().catch(() => {
        // Si falla la carga del usuario, limpiar tokens
        localStorage.removeItem("auth_token")
        localStorage.removeItem("refresh_token")
      })
    }
  }, [loadUser, isAuthenticated])

  return <>{children}</>
}
