import { apiClient } from "@/lib/api"
import type { Lab, LabFilters, ApiResponse } from "@/lib/types"

export class LabService {
  static async getLabs(filters?: LabFilters): Promise<Lab[]> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/labs?${queryString}` : "/labs"

    const response = await apiClient.get<ApiResponse<Lab[]>>(endpoint)
    return response.data
  }

  static async getLabById(id: string): Promise<Lab> {
    const response = await apiClient.get<ApiResponse<Lab>>(`/labs/${id}`)
    return response.data
  }

  static async getAvailableTimeSlots(labId: string, date: string): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(`/labs/${labId}/available-slots?date=${date}`)
    return response.data
  }

  static async createLab(labData: Omit<Lab, "id" | "createdAt" | "updatedAt">): Promise<Lab> {
    const response = await apiClient.post<ApiResponse<Lab>>("/labs", labData)
    return response.data
  }

  static async updateLab(id: string, labData: Partial<Lab>): Promise<Lab> {
    const response = await apiClient.put<ApiResponse<Lab>>(`/labs/${id}`, labData)
    return response.data
  }

  static async deleteLab(id: string): Promise<void> {
    await apiClient.delete(`/labs/${id}`)
  }
}
