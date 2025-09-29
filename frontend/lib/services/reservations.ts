import { apiClient } from "@/lib/api"
import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationFilters,
  ApiResponse,
} from "@/lib/types"

export class ReservationService {
  static async createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>("/reservations", reservationData)
    return response.data
  }

  static async getReservations(filters?: ReservationFilters): Promise<Reservation[]> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/reservations?${queryString}` : "/reservations"

    const response = await apiClient.get<ApiResponse<Reservation[]>>(endpoint)
    return response.data
  }

  static async getReservationById(id: string): Promise<Reservation> {
    const response = await apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`)
    return response.data
  }

  static async updateReservation(id: string, updates: UpdateReservationRequest): Promise<Reservation> {
    const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/${id}`, updates)
    return response.data
  }

  static async cancelReservation(id: string): Promise<void> {
    await apiClient.put(`/reservations/${id}/cancel`)
  }

  static async deleteReservation(id: string): Promise<void> {
    await apiClient.delete(`/reservations/${id}`)
  }

  static async getUserReservations(userId?: string): Promise<Reservation[]> {
    const endpoint = userId ? `/reservations/user/${userId}` : "/reservations/me"
    const response = await apiClient.get<ApiResponse<Reservation[]>>(endpoint)
    return response.data
  }
}
