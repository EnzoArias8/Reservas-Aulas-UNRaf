"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClockIcon, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"

interface TimeRangePickerProps {
  availableTimeSlots: string[]
  selectedTimeSlot: string
  onSelectTimeSlot: (timeSlot: string) => void
  selectedDate?: Date // Agregar fecha seleccionada para restricciones de sábado
}

export function TimeRangePicker({
  availableTimeSlots,
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
        const slotString = `${timeString} - ${minutesToTime(minutes + 15)}`
        rangeSlots.push(slotString)
      }

      const allSlotsAvailable = rangeSlots.every(slot => availableTimeSlots.includes(slot))
      setIsValidRange(allSlotsAvailable)
    } else {
      setIsValidRange(false)
    }
  }, [startTime, endTime, availableTimeSlots])

  // Función para verificar si un horario está disponible
  const isTimeAvailable = (time: string) => {
    const isSaturday = selectedDate?.getDay() === 6
    const timeSlots = []
    
    if (isSaturday) {
      // Solo permitir horarios de 8hs a 12hs los sábados
      for (let hour = 8; hour < 12; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const endMinute = minute + 15
          const endHour = endMinute >= 60 ? hour + 1 : hour
          const endMinuteAdjusted = endMinute >= 60 ? endMinute - 60 : endMinute
          
          if (endHour < 12) {
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMinuteAdjusted.toString().padStart(2, '0')}`
            timeSlots.push(`${startTime} - ${endTime}`)
          }
        }
      }
    } else {
      // Horarios normales para otros días
      for (let hour = 8; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          if (hour === 23 && minute > 0) break
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const endMinute = minute + 15
          const endHour = endMinute >= 60 ? hour + 1 : hour
          const endMinuteAdjusted = endMinute >= 60 ? endMinute - 60 : endMinute
          
          if (endHour <= 23) {
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMinuteAdjusted.toString().padStart(2, '0')}`
            timeSlots.push(`${startTime} - ${endTime}`)
          }
        }
      }
    }
    
    // Verificar si este horario específico está disponible
    return availableTimeSlots.some(slot => slot.includes(time))
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
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Hora de Inicio
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar hora de inicio</option>
            {timeOptions.map((time) => {
              const isAvailable = isTimeAvailable(time)
              return (
                <option 
                  key={time} 
                  value={time}
                  disabled={!isAvailable}
                  style={{ color: isAvailable ? 'black' : 'gray' }}
                >
                  {time} {!isAvailable ? '(Ocupado)' : ''}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Hora de Fin
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!startTime}
          >
            <option value="">Seleccionar hora de fin</option>
            {timeOptions
              .filter(time => !startTime || timeToMinutes(time) > timeToMinutes(startTime))
              .map((time) => {
                const isAvailable = isTimeAvailable(time)
                return (
                  <option 
                    key={time} 
                    value={time}
                    disabled={!isAvailable}
                    style={{ color: isAvailable ? 'black' : 'gray' }}
                  >
                    {time} {!isAvailable ? '(Ocupado)' : ''}
                  </option>
                )
              })}
          </select>
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
            <p className="text-sm text-red-600 mt-2">
              Este horario no está disponible o se superpone con reservas existentes.
            </p>
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
