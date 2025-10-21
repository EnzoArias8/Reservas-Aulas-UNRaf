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

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function fetchReservations() {
      setIsLoading(true)
      setError(null)
      try {
        // Usar axiosClient que incluye el token automáticamente
        const res = await axiosClient.get("/reservations/me")
        const items: Reservation[] = res.data?.data || res.data || []

        // Separar próximas y pasadas según la fecha
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const upcoming: Reservation[] = []
        const past: Reservation[] = []

        items.forEach((r) => {
          const d = parseISO(r.date)
          if (isBefore(d, today)) past.push(r)
          else upcoming.push(r)
        })

        if (!cancelled) setData({ upcoming, past })
      } catch (e: any) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchReservations()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { data, isLoading, error }
}

export function useCancelReservation() {
  const [isPending, setIsPending] = useState(false)

  const mutate = useCallback(async (reservationId: string) => {
    setIsPending(true)
    try {
      // Usar axiosClient para DELETE
      await axiosClient.delete(`/reservations/${reservationId}`)
      return true
    } catch (e) {
      throw e
    } finally {
      setIsPending(false)
    }
  }, [])

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