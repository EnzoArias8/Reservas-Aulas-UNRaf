"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LabService } from "@/lib/services/labs"
import type { Lab, LabFilters } from "@/lib/types"

export const useLabs = (filters?: LabFilters) => {
  return useQuery({
    queryKey: ["labs", filters],
    queryFn: () => LabService.getLabs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export const useLab = (id: string) => {
  return useQuery({
    queryKey: ["lab", id],
    queryFn: () => LabService.getLabById(id),
    enabled: !!id,
  })
}

export const useAvailableTimeSlots = (labId: string, date: string) => {
  return useQuery({
    queryKey: ["available-slots", labId, date],
    queryFn: () => LabService.getAvailableTimeSlots(labId, date),
    enabled: !!labId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

export const useCreateLab = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: LabService.createLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] })
    },
  })
}

export const useUpdateLab = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lab> }) => LabService.updateLab(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["labs"] })
      queryClient.invalidateQueries({ queryKey: ["lab", id] })
    },
  })
}

export const useDeleteLab = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: LabService.deleteLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] })
    },
  })
}
