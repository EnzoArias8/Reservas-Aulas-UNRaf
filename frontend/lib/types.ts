// Tipos principales del sistema
export interface User {
  id: string
  name: string
  email: string
  faculty?: string
  role: "Estudiante" | "Profesor" | "Investigador" | "Admin"
  phone?: string
  career?: string
  semester?: string
  createdAt: string
  updatedAt: string
}

export interface Lab {
  id: string
  name: string
  building: string
  floor: string
  capacity: number
  equipment: string[]
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Reservation {
  id: string
  userId: string
  labId: string
  date: string // YYYY-MM-DD
  timeSlot: string
  purpose: string
  attendees: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  createdAt: string
  updatedAt: string
  // Relaciones
  user?: User
  lab?: Lab
}

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

// Tipos para requests/responses de API
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  faculty: string
  role: "Estudiante" | "Profesor" | "Investigador"
}

export interface CreateReservationRequest {
  labId: string
  date: string
  timeSlot: string
  purpose: string
  attendees: number
}

export interface UpdateReservationRequest {
  date?: string
  timeSlot?: string
  purpose?: string
  attendees?: number
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface ApiResponse<T> {
  token: any
  refreshToken(arg0: string, refreshToken: any): unknown
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipos para filtros y queries
export interface ReservationFilters {
  status?: Reservation["status"]
  labId?: string
  dateFrom?: string
  dateTo?: string
  userId?: string
}

export interface LabFilters {
  building?: string
  capacity?: number
  isActive?: boolean
}
