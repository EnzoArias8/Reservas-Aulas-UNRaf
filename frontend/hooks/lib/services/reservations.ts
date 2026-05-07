import { axiosClient } from "@/lib/api"
import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationFilters,
  ApiResponse,
} from "@/lib/types"

export class ReservationService {
  static async createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
    const response = await axiosClient.post("/reservations", reservationData)
    return response.data?.data || response.data
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

    const response = await axiosClient.get(endpoint)
    return response.data?.data || response.data
  }

  static async getReservationById(id: string): Promise<Reservation> {
    console.log("🔍 Fetching reservation with ID:", id)
    const response = await axiosClient.get(`/reservations/${id}`)
    console.log("📦 Reservation response:", response.data)
    return response.data?.data || response.data
  }

  static async updateReservation(id: string, updates: UpdateReservationRequest): Promise<Reservation> {
    const response = await axiosClient.put(`/reservations/${id}`, updates)
    return response.data?.data || response.data
  }

  static async cancelReservation(id: string): Promise<void> {
    await axiosClient.put(`/reservations/${id}/cancel`)
  }

  static async deleteReservation(id: string): Promise<void> {
    await axiosClient.delete(`/reservations/${id}`)
  }

  static async getUserReservations(userId?: string): Promise<Reservation[]> {
    const endpoint = userId ? `/reservations/user/${userId}` : "/reservations/me"
    const response = await axiosClient.get(endpoint)
    return response.data?.data || response.data
  }
}
