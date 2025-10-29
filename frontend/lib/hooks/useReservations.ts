import { useEffect, useState, useCallback } from "react"
import { parseISO, isBefore } from "date-fns"
import type { Reservation } from "../types"
import { axiosClient } from "../api"
import { ReservationService } from "../services/reservations"

type ReservationsResponse = {
  upcoming: Reservation[]
  past: Reservation[]
}

export function useUserReservations(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {}
  const [data, setData] = useState<ReservationsResponse | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Usar axiosClient que incluye el token automáticamente
      const res = await axiosClient.get("/reservations/me")
      
      // El backend ahora devuelve { upcoming, past } directamente
      const responseData = res.data?.data || {}
      const upcoming: Reservation[] = responseData.upcoming || []
      const past: Reservation[] = responseData.past || []

      setData({ upcoming, past })
    } catch (e: any) {
      setError(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function loadReservations() {
      await fetchReservations()
    }

    loadReservations()
    return () => {
      cancelled = true
    }
  }, [enabled, fetchReservations])

  return { data, isLoading, error, refetch: fetchReservations }
}

export function useCancelReservation(onSuccess?: () => void) {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (reservationId: string) => {
    setIsPending(true)
    try {
      // Usar axiosClient para PUT con cancel
      await axiosClient.put(`/reservations/${reservationId}/cancel`)
      if (onSuccess) onSuccess()
      return true
    } catch (e) {
      throw e
    } finally {
      setIsPending(false)
    }
  }, [onSuccess])

  return { mutate, isPending }
}

export function useReservationById(id: string | null) {
  const [data, setData] = useState<Reservation | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setData(undefined)
      return
    }

    let cancelled = false

    async function fetchReservation() {
      setIsLoading(true)
      setError(null)
      try {
        const reservation = await ReservationService.getReservationById(id)
        if (!cancelled) {
          setData(reservation)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Error al cargar la reserva'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchReservation()

    return () => {
      cancelled = true
    }
  }, [id])

  return { data, isLoading, error }
}