import { useState, useEffect } from "react"
import { axiosClient } from "@/lib/api"

interface CalendarRestrictions {
  semesters: Array<{
    _id: string
    name: string
    startDate: string
    endDate: string
    isActive: boolean
  }>
  examWeeks: Array<{
    _id: string
    name: string
    startDate: string
    endDate: string
  }>
  holidays: Array<{
    _id: string
    name: string
    date: string
    type: 'national' | 'academic' | 'university'
  }>
}

export function useCalendarRestrictions() {
  const [restrictions, setRestrictions] = useState<CalendarRestrictions>({
    semesters: [],
    examWeeks: [],
    holidays: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cargar restricciones para todos los usuarios (las rutas ahora son públicas)
    loadRestrictions()
  }, [])

  const loadRestrictions = async () => {
    try {
      setLoading(true)
      
      // Cargar cuatrimestres activos
      const semestersRes = await axiosClient.get("/admin/semesters")
      const semesters = semestersRes.data?.data || semestersRes.data || []

      // Cargar semanas de examen
      const examWeeksRes = await axiosClient.get("/admin/exam-weeks")
      const examWeeks = examWeeksRes.data?.data || examWeeksRes.data || []

      // Cargar feriados
      const holidaysRes = await axiosClient.get("/admin/holidays")
      const holidays = holidaysRes.data?.data || holidaysRes.data || []

      setRestrictions({
        semesters,
        examWeeks,
        holidays
      })
    } catch (error) {
      console.error("Error loading calendar restrictions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Verificar si una fecha está dentro de un cuatrimestre activo
  const isDateInActiveSemester = (date: Date): boolean => {
    const activeSemester = restrictions.semesters.find(s => s.isActive)
    if (!activeSemester) {
      return false
    }

    const dateStr = date.toISOString().split('T')[0]
    // Normalizar las fechas de inicio y fin a solo fecha (sin tiempo)
    const startDate = activeSemester.startDate.split('T')[0]
    const endDate = activeSemester.endDate.split('T')[0]
    
    return dateStr >= startDate && dateStr <= endDate
  }

  // Verificar si una fecha es feriado
  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return restrictions.holidays.some(holiday => {
      // Normalizar la fecha del feriado a solo fecha (sin hora)
      const holidayDateStr = holiday.date.split('T')[0]
      return holidayDateStr === dateStr
    })
  }

  // Verificar si una fecha está en semana de examen
  const isExamWeek = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return restrictions.examWeeks.some(examWeek => 
      dateStr >= examWeek.startDate && dateStr <= examWeek.endDate
    )
  }

  // Verificar si una fecha está disponible para reservas
  const isDateAvailable = (date: Date): boolean => {
    // No permitir reservas en feriados
    if (isHoliday(date)) return false
    
    // Las semanas de examen SÍ permiten reservas (solo bloquean reservas recurrentes)
    // if (isExamWeek(date)) return false  // COMENTADO: Las semanas de examen permiten reservas normales
    
    // Solo permitir reservas en cuatrimestres activos
    if (!isDateInActiveSemester(date)) return false
    
    return true
  }

  // Obtener el cuatrimestre activo actual
  const getActiveSemester = () => {
    return restrictions.semesters.find(s => s.isActive)
  }

  // Obtener información sobre restricciones para una fecha
  const getDateRestrictionInfo = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    
    if (isHoliday(date)) {
      const holiday = restrictions.holidays.find(h => {
        const holidayDateStr = h.date.split('T')[0]
        return holidayDateStr === dateStr
      })
      return {
        isRestricted: true,
        reason: 'Feriado',
        message: holiday?.name || 'Día no laborable'
      }
    }
    
    // Las semanas de examen ya no bloquean reservas, solo bloquean reservas recurrentes
    // if (isExamWeek(date)) {
    //   const examWeek = restrictions.examWeeks.find(ew => 
    //     dateStr >= ew.startDate && dateStr <= ew.endDate
    //   )
    //   return {
    //     isRestricted: true,
    //     reason: 'Semana de Examen',
    //     message: examWeek?.name || 'Mesas de examen'
    //   }
    // }
    
    if (!isDateInActiveSemester(date)) {
      return {
        isRestricted: true,
        reason: 'Fuera del Cuatrimestre',
        message: 'No hay clases en este período'
      }
    }
    
    return {
      isRestricted: false,
      reason: null,
      message: null
    }
  }

  return {
    restrictions,
    loading,
    isDateAvailable,
    isHoliday,
    isExamWeek,
    isDateInActiveSemester,
    getActiveSemester,
    getDateRestrictionInfo,
    loadRestrictions
  }
}













