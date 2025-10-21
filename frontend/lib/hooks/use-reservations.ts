"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReservationService } from "@/lib/services/reservations"
import type { UpdateReservationRequest, ReservationFilters } from "@/lib/types"

export const useReservations = (filters?: ReservationFilters) => {
  return useQuery({
    queryKey: ["reservations", filters],
    queryFn: () => ReservationService.getReservations(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export const useUserReservations = (userId?: string) => {
  return useQuery({
    queryKey: ["user-reservations", userId],
    queryFn: () => ReservationService.getUserReservations(userId),
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

export const useReservation = (id: string) => {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => ReservationService.getReservationById(id),
    enabled: !!id,
  })
}

export const useCreateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ReservationService.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      queryClient.invalidateQueries({ queryKey: ["user-reservations"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export const useUpdateReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationRequest }) =>
      ReservationService.updateReservation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      queryClient.invalidateQueries({ queryKey: ["user-reservations"] })
      queryClient.invalidateQueries({ queryKey: ["reservation", id] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export const useCancelReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ReservationService.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      queryClient.invalidateQueries({ queryKey: ["user-reservations"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export const useDeleteReservation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ReservationService.deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      queryClient.invalidateQueries({ queryKey: ["user-reservations"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export const useReservationById = (id: string | null) => {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => ReservationService.getReservationById(id!),
    enabled: !!id,
  })
}