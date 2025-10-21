import { apiClient, axiosClient } from "@/lib/api"
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from "@/lib/types"

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    // El backend responde { success, accessToken, refreshToken }
    const response = await apiClient.post<any>("/auth/login", credentials)

    const accessToken: string = response.accessToken
    const refreshToken: string = response.refreshToken

    if (!accessToken) {
      throw new Error("Login sin accessToken")
    }

    // Guardar tokens
    apiClient.setToken(accessToken)
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken)
    }

    // Obtener usuario actual
    const user = await AuthService.getCurrentUser()

    // Persistir usuario para el Header
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify({
        id: (user as any)?._id || (user as any)?.id,
        name: (user as any)?.nombre || (user as any)?.name || "Usuario",
        email: user.email,
        role: (user as any)?.role,
        isLoggedIn: true,
      }))
    }

    return {
      user,
      token: accessToken,
      refreshToken: refreshToken || "",
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    // El backend responde { success, accessToken, refreshToken }
    const response = await apiClient.post<any>("/auth/register", userData)

    const accessToken: string = response.accessToken
    const refreshToken: string = response.refreshToken

    if (!accessToken) {
      throw new Error("Registro sin accessToken")
    }

    apiClient.setToken(accessToken)
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken)
    }

    const user = await AuthService.getCurrentUser()

    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify({
        id: (user as any)?._id || (user as any)?.id,
        name: (user as any)?.nombre || (user as any)?.name || "Usuario",
        email: user.email,
        role: (user as any)?.role,
        isLoggedIn: true,
      }))
    }

    return {
      user,
      token: accessToken,
      refreshToken: refreshToken || "",
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      apiClient.clearToken?.()
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("currentUser")
      }
    }
  }

  static async getCurrentUser(): Promise<User> {
    const response = await axiosClient.get<any>("/auth/me")
    return response.data.data
  }

  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axiosClient.put<ApiResponse<User>>("/auth/profile", userData)
    return response.data.data
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axiosClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    })
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await apiClient.post<any>("/auth/refresh", { refreshToken })
    const accessToken: string = response.data?.accessToken || response.accessToken
    if (!accessToken) {
      throw new Error("No se recibió nuevo accessToken")
    }
    apiClient.setToken(accessToken)
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
    }
    return accessToken
  }
}

// import { apiClient } from '../api' // Removed duplicate import

export type LoginPayload = { email: string; password: string }

export async function login(payload: LoginPayload) {
  try {
    const res: any = await apiClient.post('/auth/login', payload)
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
