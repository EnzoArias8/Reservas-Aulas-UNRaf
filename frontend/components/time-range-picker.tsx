"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClockIcon, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"

interface TimeRangePickerProps {
  availableTimeSlots: string[]
  allTimeSlots?: string[] // Todos los slots posibles (incluyendo ocupados)
  selectedTimeSlot: string
  onSelectTimeSlot: (timeSlot: string) => void
  selectedDate?: Date // Agregar fecha seleccionada para restricciones de sábado
}

export function TimeRangePicker({
  availableTimeSlots,
  allTimeSlots = [],
  selectedTimeSlot,
  onSelectTimeSlot,
  selectedDate,
}: TimeRangePickerProps) {
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isValidRange, setIsValidRange] = useState(false)

  // Generar opciones de tiempo cada 15 minutos
  const generateTimeOptions = () => {
    const options = []
    const isSaturday = selectedDate?.getDay() === 6
    
    if (isSaturday) {
      // Solo permitir horarios de 8hs a 12hs los sábados
      for (let hour = 8; hour < 12; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          options.push(timeString)
        }
      }
    } else {
      // Horarios normales para otros días
      for (let hour = 8; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          if (hour === 23 && minute > 0) break
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          options.push(timeString)
        }
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // Validar que el rango seleccionado esté disponible
  useEffect(() => {
    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      
      if (startMinutes >= endMinutes) {
        setIsValidRange(false)
        return
      }

      // Verificar que todos los slots de 15 minutos en el rango estén disponibles
      const rangeSlots = []
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
        const timeString = minutesToTime(minutes)
        const nextTimeString = minutesToTime(minutes + 15)
        const slotString = `${timeString} - ${nextTimeString}`
        rangeSlots.push(slotString)
      }

      // Verificar que TODOS los slots del rango estén en availableTimeSlots
      const allSlotsAvailable = rangeSlots.length > 0 && rangeSlots.every(slot => availableTimeSlots.includes(slot))
      setIsValidRange(allSlotsAvailable)
    } else {
      setIsValidRange(false)
    }
  }, [startTime, endTime, availableTimeSlots])

  // Función para verificar si un horario está disponible como hora de inicio
  // Para hora de inicio: debe tener al menos un slot de 15 minutos disponible
  const isTimeAvailable = (time: string) => {
    if (allTimeSlots.length > 0) {
      // Buscar slots que empiecen con esta hora
      const slotsStartingAtTime = allTimeSlots.filter(slot => {
        const [slotStart] = slot.split(' - ')
        return slotStart === time
      })
      
      // Si hay slots que empiezan en esta hora, verificar si al menos uno está disponible
      if (slotsStartingAtTime.length > 0) {
        return slotsStartingAtTime.some(slot => availableTimeSlots.includes(slot))
      }
      return false
    }
    
    // Fallback: verificar directamente en availableSlots
    return availableTimeSlots.some(slot => {
      const [slotStart] = slot.split(' - ')
      return slotStart === time
    })
  }
  
  // Función para obtener el texto del estado del horario
  const getTimeStatus = (time: string): { isAvailable: boolean; statusText: string } => {
    if (allTimeSlots.length > 0) {
      // Buscar todos los slots que empiecen con esta hora
      const slotsStartingAtTime = allTimeSlots.filter(slot => {
        const [slotStart] = slot.split(' - ')
        return slotStart === time
      })
      
      if (slotsStartingAtTime.length === 0) {
        return { isAvailable: false, statusText: ' (Ocupado)' }
      }
      
      // Contar cuántos están disponibles
      const availableCount = slotsStartingAtTime.filter(slot => availableTimeSlots.includes(slot)).length
      const isAvailable = availableCount > 0
      
      if (!isAvailable) {
        return { isAvailable: false, statusText: ' (Ocupado)' }
      }
      
      return { isAvailable: true, statusText: '' }
    }
    
    // Fallback sin allTimeSlots
    const isAvailable = availableTimeSlots.some(slot => {
      const [slotStart] = slot.split(' - ')
      return slotStart === time
    })
    
    return { isAvailable, statusText: isAvailable ? '' : ' (Ocupado)' }
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const handleConfirm = () => {
    if (isValidRange && startTime && endTime) {
      onSelectTimeSlot(`${startTime} - ${endTime}`)
    }
  }

  const handleClear = () => {
    setStartTime("")
    setEndTime("")
    onSelectTimeSlot("")
  }

  return (
    <div className="space-y-4">
      {selectedDate?.getDay() === 6 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los sábados solo están disponibles para reservas de 8:00 a 12:00.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Hora de Inicio
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Seleccionar hora de inicio</option>
            {timeOptions.map((time) => {
              const { isAvailable, statusText } = getTimeStatus(time)
              return (
                <option 
                  key={time} 
                  value={time}
                  disabled={!isAvailable}
                  className={isAvailable ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}
                >
                  {time}{statusText}
                </option>
              )
            })}
          </select>
          {timeOptions.filter(time => !getTimeStatus(time).isAvailable).length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Los horarios marcados como "(Ocupado)" no están disponibles
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Hora de Fin
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!startTime}
          >
            <option value="">Seleccionar hora de fin</option>
            {timeOptions
              .filter(time => !startTime || timeToMinutes(time) > timeToMinutes(startTime))
              .map((time) => {
                const { isAvailable, statusText } = getTimeStatus(time)
                return (
                  <option 
                    key={time} 
                    value={time}
                    disabled={!isAvailable}
                    className={isAvailable ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}
                  >
                    {time}{statusText}
                  </option>
                )
              })}
          </select>
          {!startTime && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Primero selecciona una hora de inicio
            </p>
          )}
        </div>
      </div>

      {startTime && endTime && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="mr-2 h-4 w-4" />
              <span className="font-medium">
                {startTime} - {endTime}
              </span>
              {!isValidRange && (
                <XCircle className="ml-2 h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Limpiar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={!isValidRange}
                className={cn(
                  isValidRange 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                Confirmar
              </Button>
            </div>
          </div>
          {!isValidRange && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Horario no disponible
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Este rango de horario no está completamente disponible. Algunos intervalos de 15 minutos dentro de este rango ya están ocupados por otras reservas. Por favor, selecciona un horario diferente que esté completamente libre.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTimeSlot && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              Horario seleccionado: {selectedTimeSlot}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Cambiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
