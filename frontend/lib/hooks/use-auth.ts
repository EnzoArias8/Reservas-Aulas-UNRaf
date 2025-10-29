"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthService } from "@/lib/services/auth"
import type { User, LoginRequest, RegisterRequest } from "@/lib/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  init: () => (() => void) | undefined
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      // Listener para cambios en localStorage
      init: () => {
        if (typeof window === "undefined") return
        
        const handleStorageChange = () => {
          const token = localStorage.getItem("accessToken")
          if (token) {
            get().loadUser()
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        }

        // Escuchar cambios en localStorage
        window.addEventListener('storage', handleStorageChange)
        
        // Cargar usuario inicial
        get().loadUser()

        return () => {
          window.removeEventListener('storage', handleStorageChange)
        }
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true })
        try {
          const authResponse = await AuthService.login(credentials)
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true })
        try {
          const authResponse = await AuthService.register(userData)
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await AuthService.logout()
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true })
        try {
          const updatedUser = await AuthService.updateProfile(userData)
          set({
            user: updatedUser,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      loadUser: async () => {
        // Solo intentar cargar usuario si hay un token en localStorage
        if (typeof window === "undefined") return
        
        // Limpiar estado persistido incorrectamente
        const token = localStorage.getItem("accessToken")
        console.log("🔍 loadUser - token exists:", !!token)
        
        if (!token) {
          console.log("🔍 loadUser - no token, setting unauthenticated")
          // Limpiar completamente el estado
          localStorage.removeItem("currentUser")
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return
        }

        set({ isLoading: true })
        try {
          const user = await AuthService.getCurrentUser()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // Si falla la autenticación, limpiar tokens
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("currentUser")
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // NO persistir el estado de autenticación - siempre verificar desde localStorage
        user: null,
        isAuthenticated: false,
      }),
    },
  ),
)
