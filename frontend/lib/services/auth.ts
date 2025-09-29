import { apiClient } from "@/lib/api"
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from "@/lib/types"

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", credentials)

    // Guardar tokens
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", String(response.data.refreshToken))
    }

    return {
      user: response.data.data.user,
      token: response.data.data.token,
      refreshToken: typeof response.data.data.refreshToken === "string" ? response.data.data.refreshToken : "",
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", userData)

    // Guardar tokens
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", String(response.data.refreshToken))
    }

    return {
      user: response.data.data.user,
      token: response.data.data.token,
      refreshToken: typeof response.data.data.refreshToken === "string" ? response.data.data.refreshToken : "",
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      delete apiClient.defaults.headers.common["Authorization"]
    }
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me")
    return response.data.data
  }

  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>("/auth/profile", userData)
    return response.data.data
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    })
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await apiClient.post<ApiResponse<{ token: string }>>("/auth/refresh", {
      refreshToken,
    })

    apiClient.setToken(response.data.token)
    return response.data.token
  }
}

// import { apiClient } from '../api' // Removed duplicate import

export type LoginPayload = { email: string; password: string }

export async function login(payload: LoginPayload) {
  try {
    const res = await apiClient.post('/auth/login', payload)
    return res.data
  } catch (err: any) {
    // devolver error claro para el UI
    const msg = err?.response?.data?.message || err.message || 'Error de red'
    throw new Error(msg)
  }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout')
    return true
  } catch {
    return false
  }
}
