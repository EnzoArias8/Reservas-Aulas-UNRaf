import { useEffect, useState, useCallback } from "react"
import { parseISO, isBefore } from "date-fns"
import type { Reservation } from "../types"

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
        // Ajusta la URL según tu backend
        const res = await fetch("/api/reservations/me", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const items: Reservation[] = await res.json()

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
      // Ajusta la URL/metodo según tu API (aquí usamos DELETE en endpoint REST)
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      // opcional: devolver el resultado o true
      return true
    } catch (e) {
      throw e
    } finally {
      setIsPending(false)
    }
  }, [])

  return { mutate, isPending }
}