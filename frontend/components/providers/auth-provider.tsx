"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadUser, isAuthenticated } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      apiClient.setToken(token)
      if (!isAuthenticated) {
        loadUser().catch(() => {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        })
      }
    }
  }, [loadUser, isAuthenticated])

  return <>{children}</>
}
