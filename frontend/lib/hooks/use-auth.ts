"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthService } from "@/lib/services/auth"
import type { User, LoginRequest, RegisterRequest } from "@/lib/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
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
        set({ isLoading: true })
        try {
          const user = await AuthService.getCurrentUser()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
