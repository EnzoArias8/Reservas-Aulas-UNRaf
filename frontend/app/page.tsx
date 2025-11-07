"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { TimeRangePicker } from "@/components/time-range-picker"
import { LabCard } from "@/components/lab-card"
import { ReservationConfirmation } from "@/components/reservation-confirmation"
import { RecurringReservationConfirmation } from "@/components/recurring-reservation-confirmation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, FileText, Loader2 } from "lucide-react"
import { LoginModal } from "@/components/auth/login-modal"
import { RegisterModal } from "@/components/auth/register-modal"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ✅ HOOKS REALES - Reemplaza todas las simulaciones
import { useAuth } from "@/lib/hooks/use-auth"
import { useCreateReservation, useReservationById } from "@/lib/hooks/use-reservations"
import { useAvailableTimeSlots, useLabs } from "@/lib/hooks/use-labs"
import { useCalendarRestrictions } from "@/lib/hooks/use-calendar-restrictions"
import { axiosClient } from "@/lib/api"

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  // Domingo eliminado para reservas semanales
]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
]

const formSchema = z.object({
  labId: z.string({
    required_error: "Por favor selecciona un laboratorio",
  }),
  date: z.date({
    required_error: "Por favor selecciona una fecha para tu reserva",
  }),
  timeSlot: z.string({
    required_error: "Por favor selecciona un horario",
  }),
  purpose: z.string().optional(),
  attendees: z.string().min(1, {
    message: "Por favor ingresa el número de asistentes",
  }),
})

export default function LabReservationPage() {
  const searchParams = useSearchParams()
  const editReservationId = searchParams.get('edit')
  
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedLab, setSelectedLab] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showRecurringConfirmation, setShowRecurringConfirmation] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("browse")
  const [createdReservation, setCreatedReservation] = useState<any>(null)
  const [createdRecurringReservation, setCreatedRecurringReservation] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isWeeklyReservation, setIsWeeklyReservation] = useState(false)
  const confirmationRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  
  // Estados para reserva semanal
  const [weeklyForm, setWeeklyForm] = useState({
    dayOfWeek: 1, // 1 = Lunes
    startTime: "08:00",
    endTime: "10:00",
    semester: "",
    purpose: "",
    attendees: 1
  })
  
  // Estados para preservar datos del formulario durante login
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const [pendingSelectedLab, setPendingSelectedLab] = useState<string | null>(null)
  const [pendingDate, setPendingDate] = useState<Date | undefined>(undefined)
  
  // Estados para filtros
  const [buildingFilter, setBuildingFilter] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [equipmentFilter, setEquipmentFilter] = useState("")

  // Estados para datos adicionales
  const [semesters, setSemesters] = useState<any[]>([])
  const [loadingSemesters, setLoadingSemesters] = useState(false)

  // ✅ HOOKS REALES - Reemplaza localStorage y simulaciones
  const { user, isLoading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const createReservationMutation = useCreateReservation()
  const { data: editReservation, isLoading: isLoadingEditReservation } = useReservationById(editReservationId)
  const { 
    isDateAvailable, 
    getDateRestrictionInfo, 
    getActiveSemester,
    loading: restrictionsLoading 
  } = useCalendarRestrictions()

  // ✅ El hook useAuth ya carga el usuario automáticamente

  // Evitar efectos que toquen localStorage repetidamente para no provocar bucles de render/redirect

  // Cargar cuatrimestres para reservas semanales - Solo si está autenticado y es profesor
  useEffect(() => {
    const loadSemesters = async () => {
      setLoadingSemesters(true)
      try {
        const response = await axiosClient.get("/admin/semesters")
        setSemesters(response.data?.data || response.data || [])
      } catch (error: any) {
        console.error("Error loading semesters:", error)
        // Si falla la autenticación, limpiar el estado
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem("currentUser")
        }
      } finally {
        setLoadingSemesters(false)
      }
    }
    
    // Solo cargar si está autenticado Y es profesor
    if (isAuthenticated && user?.role === "Profesor") {
      loadSemesters()
    } else {
      // Limpiar semestres si no es profesor
      setSemesters([])
    }
  }, [isAuthenticated, user])

  // ✅ Cargar aulas desde API - Solo las activas para la vista pública
  // Evitar crear un objeto nuevo en cada render para el queryKey de react-query
  const activeLabsFilter = useMemo(() => ({ isActive: true }), [])
  const { data: allLabs = [], isLoading: labsLoading } = useLabs(activeLabsFilter)

  // ✅ Filtrar aulas según los filtros aplicados
  const labs = allLabs.filter((lab: any) => {
    // Filtro por edificio
    if (buildingFilter && lab.building !== buildingFilter) {
      return false
    }
    
    // Filtro por capacidad
    if (capacityFilter) {
      const capacity = lab.capacity
      switch (capacityFilter) {
        case "10-or-less":
          if (capacity > 10) return false
          break
        case "11-20":
          if (capacity < 11 || capacity > 20) return false
          break
        case "21-30":
          if (capacity < 21 || capacity > 30) return false
          break
        case "31-40":
          if (capacity < 31 || capacity > 40) return false
          break
        case "40-plus":
          if (capacity <= 40) return false
          break
      }
    }
    
    // Filtro por equipamiento
    if (equipmentFilter && lab.equipment) {
      const hasEquipment = lab.equipment.some((equipment: string) => 
        equipment.toLowerCase().includes(equipmentFilter.toLowerCase())
      )
      if (!hasEquipment) {
        return false
      }
    }
    
    return true
  })

  // ✅ HOOK REAL para horarios disponibles
  const { data: timeSlotsData, isLoading: slotsLoading } = useAvailableTimeSlots(
    selectedLab || "",
    date ? format(date, "yyyy-MM-dd") : "",
  )
  const availableTimeSlots = timeSlotsData?.availableSlots || []
  const allTimeSlots = timeSlotsData?.allSlots || []

  // Validación de capacidad en vivo para la reserva semanal
  const selectedLabObj = labs.find((lab: any) => lab._id === selectedLab)
  const weeklyCapacityExceeded = !!selectedLabObj && weeklyForm.attendees > (selectedLabObj?.capacity || Infinity)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      attendees: "",
    },
  })

  // ✅ Cargar datos de reserva para edición
  useEffect(() => {
    if (editReservationId && editReservation) {
      setIsEditing(true)
      setSelectedLab(
        editReservation.lab?._id || 
        (typeof editReservation.labId === 'object' ? editReservation.labId?._id : editReservation.labId) ||
        ""
      )
      setDate(new Date(editReservation.date))
      setActiveTab("reserve")
      
      // Precargar el formulario con los datos de la reserva
      form.reset({
        labId: (
          editReservation.lab?._id || 
          (typeof editReservation.labId === 'object' ? editReservation.labId?._id : editReservation.labId) ||
          ""
        ),
        date: new Date(editReservation.date),
        timeSlot: editReservation.timeSlot,
        purpose: editReservation.purpose || "",
        attendees: editReservation.attendees.toString(),
      })
    }
  }, [editReservationId, editReservation, form])

  // ✅ FUNCIÓN REAL - Reemplaza completamente las simulaciones
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("📝 onSubmit called with values:", values)
    console.log("🔐 Auth state - isAuthenticated:", isAuthenticated, "user:", user)
    console.log("🔐 localStorage accessToken:", localStorage.getItem("accessToken"))
    
    // Verificar autenticación - verificación más robusta
    const hasToken = localStorage.getItem("accessToken")
    const hasUser = localStorage.getItem("currentUser")
    
    // Verificar si realmente está autenticado
    const isReallyAuthenticated = isAuthenticated && user && hasToken && hasUser
    
    if (!isReallyAuthenticated) {
      console.log("❌ Not authenticated - isAuthenticated:", isAuthenticated, "user:", user, "hasToken:", hasToken, "hasUser:", hasUser)
      
      // Solo limpiar si hay inconsistencias en localStorage
      if (!hasToken || !hasUser) {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("currentUser")
      }
      
      // Guardar datos del formulario antes de abrir el modal de login
      setPendingFormData(values)
      setPendingSelectedLab(selectedLab)
      setPendingDate(date)
      
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para hacer una reserva",
        variant: "destructive",
      })
      setIsLoginModalOpen(true)
      return
    }

    console.log("✅ User authenticated:", user)

    try {
      console.log("🚀 Calling createReservationMutation.mutateAsync...")
      // 🚀 LLAMADA REAL A LA API usando el hook
      const reservation = await createReservationMutation.mutateAsync({
        labId: values.labId,
        date: format(values.date, "yyyy-MM-dd"),
        timeSlot: values.timeSlot,
        purpose: values.purpose || "",
        attendees: Number.parseInt(values.attendees),
      })

      console.log("✅ Reservation created:", reservation)

      // Guardar reserva para mostrar confirmación
      // La reserva ahora viene con labId populado desde el backend
      setCreatedReservation(reservation)
      setShowConfirmation(true)
      setActiveTab("reserve")
      // Desplazar a la sección de confirmación para que no quede sólo el header visible
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)

      toast({
        title: "Reserva creada exitosamente",
        description: `Tu reserva para el ${format(values.date, "dd/MM/yyyy")} ha sido confirmada`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // NO limpiar selectedLab ni form aquí - se limpia en onClose de la confirmación
      // form.reset()
      // setSelectedLab(null)
    } catch (error: any) {
      console.error("❌ Error creating reservation:", error)
      console.error("Error details:", error.response?.data || error.message)

      toast({
        title: "Error al crear reserva",
        description: error.response?.data?.message || error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    }
  }

  // Los horarios ahora se generan dinámicamente en el backend
  const timeSlots = []

  // Función para continuar a la reserva
  const handleContinueToReservation = () => {
    if (selectedLab) {
      setActiveTab("reserve")
    }
  }

  // Función para manejar el éxito del login y restaurar datos
  const handleLoginSuccess = (userData: any) => {
    console.log("🎉 Login successful, restoring form data:", pendingFormData)
    
    // Restaurar datos del formulario
    if (pendingFormData) {
      form.reset(pendingFormData)
      setSelectedLab(pendingSelectedLab)
      setDate(pendingDate)
      setActiveTab("reserve")
      
      // Limpiar datos pendientes
      setPendingFormData(null)
      setPendingSelectedLab(null)
      setPendingDate(undefined)
      
      toast({
        title: "Sesión iniciada",
        description: "Ahora puedes completar tu reserva",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    }
  }

  // Función para manejar reservas semanales
  const handleWeeklyReservation = async () => {
    if (!selectedLab || !weeklyForm.semester) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    // Validar capacidad del aula
    const lab = labs.find((l: any) => l._id === selectedLab)
    if (lab && weeklyForm.attendees > lab.capacity) {
      toast({
        title: "Capacidad excedida",
        description: `El aula tiene capacidad máxima de ${lab.capacity} asistentes`,
        variant: "destructive"
      })
      return
    }

    try {
      const response = await axiosClient.post("/reservations/recurring", {
        labId: selectedLab,
        dayOfWeek: weeklyForm.dayOfWeek,
        startTime: weeklyForm.startTime,
        endTime: weeklyForm.endTime,
        semester: weeklyForm.semester,
        purpose: weeklyForm.purpose,
        attendees: weeklyForm.attendees
      })

      // Guardar la reserva creada para mostrar el comprobante
      const reservationData = response.data?.data || response.data
      
      // Guardar la reserva y mostrar el comprobante (NO limpiar el formulario aún)
      setCreatedRecurringReservation(reservationData)
      setShowRecurringConfirmation(true)
      
      // Desplazar a la sección de confirmación
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)

      toast({
        title: "Reserva semanal creada",
        description: "Tu reserva semanal se ha creado exitosamente",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la reserva semanal",
        variant: "destructive"
      })
    }
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto py-10">
        <Toaster />

        {/* Header con gradiente y fondo */}
        <div className="text-center mb-10">
          <div
            className="inline-block w-full min-h-[25rem] bg-cover bg-center bg-no-repeat
                       flex flex-col justify-start items-center pt-6"
            style={{ backgroundImage: "url('/fondo.png')" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#336699] dark:text-[#4A8FCC] px-6 py-3">
              {isEditing ? 'Editar Reserva' : 'Reservas de Aulas'}
            </h1>
          </div>
        </div>

        {isLoadingEditReservation ? (
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando datos de la reserva...</p>
              </div>
            </div>
          </div>
        ) : showRecurringConfirmation && createdRecurringReservation ? (
          <div ref={confirmationRef} className="container mx-auto py-10">
            <RecurringReservationConfirmation
              lab={
                createdRecurringReservation?.lab 
                  ? ({
                      _id: createdRecurringReservation.lab._id || createdRecurringReservation.labId || "",
                      name: createdRecurringReservation.lab.name || "",
                      building: createdRecurringReservation.lab.building || "",
                      floor: createdRecurringReservation.lab.floor || "",
                      capacity: createdRecurringReservation.lab.capacity || 0,
                      equipment: createdRecurringReservation.lab.equipment || [],
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    } as any)
                  : labs.find((lab: any) => lab._id === (createdRecurringReservation?.labId?._id || createdRecurringReservation?.labId || selectedLab))
              }
              dayOfWeek={createdRecurringReservation?.dayOfWeek ?? 1}
              startTime={createdRecurringReservation?.startTime || "08:00"}
              endTime={createdRecurringReservation?.endTime || "10:00"}
              semester={
                createdRecurringReservation?.semester?.name 
                  || semesters.find(s => s._id === (createdRecurringReservation?.semester?._id || createdRecurringReservation?.semester))?.name 
                  || "Cuatrimestre"
              }
              purpose={createdRecurringReservation?.purpose || ""}
              attendees={createdRecurringReservation?.attendees ?? 1}
              reservationId={createdRecurringReservation?._id || ""}
              onClose={() => {
                setShowRecurringConfirmation(false)
                setCreatedRecurringReservation(null)
                setWeeklyForm({
                  dayOfWeek: 1,
                  startTime: "08:00",
                  endTime: "10:00",
                  semester: "",
                  purpose: "",
                  attendees: 1
                })
                setIsWeeklyReservation(false)
                setSelectedLab(null)
                setActiveTab("browse")
                // Volver a la sección principal luego de cerrar la confirmación
                setTimeout(() => {
                  contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 0)
              }}
            />
          </div>
        ) : showConfirmation && createdReservation ? (
          <div ref={confirmationRef} className="container mx-auto py-10">
            <ReservationConfirmation
              lab={createdReservation?.labId || createdReservation?.lab || labs.find((lab: any) => lab._id === (createdReservation?.labId?._id || createdReservation?.labId || selectedLab))}
              date={date as Date}
              timeSlot={createdReservation?.timeSlot}
              purpose={createdReservation?.purpose}
              attendees={String(createdReservation?.attendees)}
              reservationId={createdReservation?._id || ""}
              onClose={() => {
                setShowConfirmation(false)
                setCreatedReservation(null)
                form.reset()
                setSelectedLab(null)
                setActiveTab("browse")
                setDate(new Date())
                // Volver a la sección principal luego de cerrar la confirmación
                setTimeout(() => {
                  contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 0)
              }}
            />
          </div>
        ) : (
          <div ref={contentRef} className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/20 shadow-xl mx-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center p-6 pb-0">
                <TabsList className="grid grid-cols-2 w-full max-w-2xl bg-slate-200 dark:from-slate-700 dark:to-slate-600">
                  <TabsTrigger
                    value="browse"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 font-medium"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Explorar Aulas
                  </TabsTrigger>
                  <TabsTrigger
                    value="reserve"
                    disabled={!selectedLab}
                    className="data-[state=active]:bg-white data-[state=active]:text-[#336699] font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continuar Reserva
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="browse" className="p-6">
                {/* Filtros */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Filtrar Aulas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro por Edificio */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Edificio</label>
                      <select
                        value={buildingFilter}
                        onChange={(e) => setBuildingFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="">Todos los edificios</option>
                        <option value="Campus E4">Campus E4</option>
                        <option value="Campus LAB">Campus LAB</option>
                        <option value="Edificio 1 (Bv. Roca)">Edificio 1 (Bv. Roca)</option>
                        <option value="Rivadavia">Rivadavia</option>
                      </select>
                    </div>

                    {/* Filtro por Capacidad */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Capacidad</label>
                      <select
                        value={capacityFilter}
                        onChange={(e) => setCapacityFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="">Cualquier capacidad</option>
                        <option value="10-or-less">10 o menos</option>
                        <option value="11-20">Entre 11 y 20</option>
                        <option value="21-30">Entre 21 y 30</option>
                        <option value="31-40">Entre 31 y 40</option>
                        <option value="40-plus">Más de 40</option>
                      </select>
                    </div>

                    {/* Filtro por Equipamiento */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Equipamiento</label>
                      <select
                        value={equipmentFilter}
                        onChange={(e) => setEquipmentFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="">Cualquier equipamiento</option>
                        <option value="Proyector">Con Proyector</option>
                        <option value="Computadoras">Con Computadoras</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Botón para limpiar filtros */}
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setBuildingFilter("")
                        setCapacityFilter("")
                        setEquipmentFilter("")
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>

                {/* Contador de resultados */}
                {!labsLoading && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    {labs.length === allLabs.length ? (
                      `Mostrando todas las ${labs.length} aulas`
                    ) : (
                      `Mostrando ${labs.length} de ${allLabs.length} aulas`
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {labsLoading && (
                    <div className="col-span-full text-center text-muted-foreground">Cargando aulas...</div>
                  )}
                  {!labsLoading && labs.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground">
                      {allLabs.length === 0 ? "No hay aulas disponibles" : "No hay aulas que coincidan con los filtros"}
                    </div>
                  )}
                  {!labsLoading && labs.map((lab: any, index: number) => {
                    // Determinar el color según la posición en la columna (0, 1, 2)
                    const columnIndex = index % 3
                    let colorClass = ""
                    
                    switch (columnIndex) {
                      case 0: // Primera columna - naranja-amarillo
                        colorClass = "bg-[#FFBF00]"
                        break
                      case 1: // Segunda columna - teal/cyan
                        colorClass = "bg-[#00AAAA]"
                        break
                      case 2: // Tercera columna - azul medio
                        colorClass = "bg-[#336699]"
                        break
                      default:
                        colorClass = "bg-[#336699]"
                    }
                    
                    return (
                      <LabCard
                        key={lab._id}
                        lab={{...lab, color: colorClass}}
                        onSelect={() => {
                          // Si ya está seleccionado, deseleccionar
                          if (selectedLab === lab._id) {
                            setSelectedLab(null)
                            form.setValue("labId", "")
                          } else {
                            // Si no está seleccionado, seleccionar
                            setSelectedLab(lab._id)
                            form.setValue("labId", lab._id)
                          }
                        }}
                        isSelected={selectedLab === lab._id}
                      />
                    )
                  })}
                </div>

              </TabsContent>

              <TabsContent value="reserve" className="p-6">
                <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
                  <CardHeader className="bg-[#00AAAA] text-white rounded-t-lg">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      Reservar un Aula
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Completa el formulario para reservar{" "}
                      {selectedLab ? labs.find((lab: any) => lab._id === selectedLab)?.name : "un aula"} para tus necesidades
                      académicas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!isAuthenticated && (
                      <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 dark:text-amber-200">
                          Inicio de sesión requerido
                        </AlertTitle>
                        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2 text-amber-700 dark:text-amber-300">
                          <span>Debes iniciar sesión para hacer una reserva.</span>
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <Button
                              size="sm"
                              onClick={() => setIsLoginModalOpen(true)}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              Iniciar Sesión
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsRegisterModalOpen(true)}
                              className="border-amber-600 text-amber-600 hover:bg-amber-50"
                            >
                              Registrarse
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Opción de reserva semanal para profesores */}
                        {isAuthenticated && user?.role === "Profesor" && (
                          <div className="bg-[#336699]/5 dark:bg-[#336699]/10 p-4 rounded-xl border border-[#336699]/20 dark:border-[#336699]/30">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-medium text-[#336699] dark:text-[#4A8FCC]">
                                Opciones de Reserva
                              </h3>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={!isWeeklyReservation ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setIsWeeklyReservation(false)}
                                >
                                  Reserva Única
                                </Button>
                                <Button
                                  type="button"
                                  variant={isWeeklyReservation ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setIsWeeklyReservation(true)}
                                >
                                  Reserva Recurrente
                                </Button>
                              </div>
                            </div>
                            {isWeeklyReservation && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                    <Label htmlFor="dayOfWeek">Día de la Semana</Label>
                                    <select
                                      id="dayOfWeek"
                                      value={weeklyForm.dayOfWeek}
                                      onChange={(e) => setWeeklyForm({...weeklyForm, dayOfWeek: parseInt(e.target.value)})}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      required
                                    >
                                      {DAYS_OF_WEEK.map((day) => (
                                        <option key={day.value} value={day.value}>
                                          {day.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="semester">Cuatrimestre</Label>
                                    <select
                                      id="semester"
                                      value={weeklyForm.semester}
                                      onChange={(e) => setWeeklyForm({...weeklyForm, semester: e.target.value})}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      required
                                    >
                                      <option value="">Seleccionar cuatrimestre</option>
                                      {semesters.map((semester) => (
                                        <option key={semester._id} value={semester._id}>
                                          {semester.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="startTime">Hora de Inicio</Label>
                                    <select
                                      id="startTime"
                                      value={weeklyForm.startTime}
                                      onChange={(e) => setWeeklyForm({...weeklyForm, startTime: e.target.value})}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      required
                                    >
                                      {(weeklyForm.dayOfWeek === 6
                                        ? TIME_SLOTS.filter((t) => t >= "08:00" && t < "12:00")
                                        : TIME_SLOTS
                                      ).map((time) => (
                                        <option key={time} value={time}>
                                          {time}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="endTime">Hora de Fin</Label>
                                    <select
                                      id="endTime"
                                      value={weeklyForm.endTime}
                                      onChange={(e) => setWeeklyForm({...weeklyForm, endTime: e.target.value})}
                                      className="w-full p-2 border border-gray-300 rounded-md"
                                      required
                                    >
                                      {TIME_SLOTS.filter(t => {
                                        if (t <= weeklyForm.startTime) return false
                                        if (weeklyForm.dayOfWeek === 6 && t > "12:00") return false
                                        return true
                                      }).map((time) => (
                                        <option key={time} value={time}>
                                          {time}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="attendees">Número de Asistentes</Label>
                                    <Input
                                      id="attendees"
                                      type="number"
                                      min="1"
                                      value={weeklyForm.attendees}
                                      onChange={(e) => setWeeklyForm({...weeklyForm, attendees: parseInt(e.target.value)})}
                                      required
                                    />
                                    {selectedLabObj && (
                                      <p className={`text-sm mt-1 ${weeklyCapacityExceeded ? 'text-red-600' : 'text-muted-foreground'}`}>
                                        Capacidad máxima: {selectedLabObj.capacity}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="purpose">Propósito de la Clase</Label>
                                  <Input
                                    id="purpose"
                                    value={weeklyForm.purpose}
                                    onChange={(e) => setWeeklyForm({...weeklyForm, purpose: e.target.value})}
                                    placeholder="Ej: Clase de Matemática I - Análisis"
                                  />
                                </div>
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    type="button"
                                    onClick={handleWeeklyReservation}
                                    disabled={weeklyCapacityExceeded}
                                    className="flex-1 bg-[#336699] hover:bg-[#2A5580]"
                                  >
                                    Crear Reserva Semanal
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsWeeklyReservation(false)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!isWeeklyReservation && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className="text-blue-800 dark:text-blue-200 font-medium">
                                    Fecha de Reserva
                                  </FormLabel>
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(selectedDate) => {
                                      if (selectedDate) {
                                        // Normalizar la fecha a medianoche en la zona horaria local
                                        // para evitar problemas de zona horaria
                                        const normalizedDate = new Date(selectedDate)
                                        normalizedDate.setHours(0, 0, 0, 0)
                                        field.onChange(normalizedDate)
                                        setDate(normalizedDate)
                                      }
                                    }}
                                    disabled={(date) => {
                                      // Fechas pasadas
                                      if (date < new Date()) return true
                                      
                                      // Domingos
                                      if (date.getDay() === 0) return true
                                      
                                      // Sábados solo están disponibles para reservas de 8hs a 12hs
                                      // (esto se manejará en el componente de horarios)
                                      
                                      // Restricciones de calendario académico
                                      if (!isDateAvailable(date)) return true
                                      
                                      return false
                                    }}
                                    className="rounded-md border bg-white dark:bg-slate-800"
                                    locale={es}
                                  />
                                  <FormDescription className="text-blue-600 dark:text-blue-400">
                                    {getActiveSemester() ? (
                                      <>Cuatrimestre activo: {getActiveSemester()?.name}</>
                                    ) : (
                                      (() => {
                                        // Si está en modo semanal y hay un cuatrimestre seleccionado, mostrarlo
                                        if (isWeeklyReservation && weeklyForm.semester) {
                                          const selected = semesters.find(s => s._id === weeklyForm.semester)
                                          return <>Cuatrimestre seleccionado: {selected?.name || 'Seleccionado'}</>
                                        }
                                        return <>No hay cuatrimestre activo configurado</>
                                      })()
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-6">
                            <div className="bg-[#336699]/5 dark:bg-[#336699]/10 p-4 rounded-xl border border-[#336699]/20 dark:border-[#336699]/30">
                              <FormField
                                control={form.control}
                                name="timeSlot"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[#336699] dark:text-[#4A8FCC] font-medium">
                                      Horario
                                    </FormLabel>
                                    {slotsLoading ? (
                                      <div className="text-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                        <p className="text-sm text-muted-foreground mt-2">Cargando horarios...</p>
                                      </div>
                                    ) : (
                                      <TimeRangePicker
                                        availableTimeSlots={availableTimeSlots}
                                        allTimeSlots={allTimeSlots}
                                        selectedTimeSlot={field.value}
                                        onSelectTimeSlot={field.onChange}
                                        selectedDate={date}
                                      />
                                    )}
                                    {availableTimeSlots.length === 0 && date && !slotsLoading && (
                                      <p className="text-sm text-red-500 mt-2">
                                        No hay horarios disponibles para esta fecha. Por favor, selecciona otra fecha.
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                              <FormField
                                control={form.control}
                                name="attendees"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-green-800 dark:text-green-200 font-medium">
                                      Número de Asistentes
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Ingresa el número de personas"
                                        {...field}
                                        min={1}
                                        max={labs.find((lab: any) => lab._id === selectedLab)?.capacity || 60}
                                        className="bg-white dark:bg-slate-800"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-green-600 dark:text-green-400">
                                      Capacidad máxima: {labs.find((lab: any) => lab._id === selectedLab)?.capacity || "N/D"}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                          <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-orange-800 dark:text-orange-200 font-medium">
                                  Propósito de la Reserva (Opcional)
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe brevemente el proyecto o actividad que planeas realizar"
                                    className="resize-none bg-white dark:bg-slate-800"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-orange-600 dark:text-orange-400">
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                            <div className="flex justify-between pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveTab("browse")}
                                className="border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                              >
                                Volver a Aulas
                              </Button>
                              <Button
                                type="submit"
                                disabled={
                                  !isAuthenticated ||
                                  createReservationMutation.isPending
                                }
                                className="bg-[#336699] hover:bg-[#2d5a85] text-white font-medium px-8 shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                {createReservationMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando reserva...
                                  </>
                                ) : (
                                  isEditing ? "Actualizar Reserva" : "Enviar Reserva"
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Modales de autenticación */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onOpenRegister={() => {
            setIsLoginModalOpen(false)
            setIsRegisterModalOpen(true)
          }}
          onLoginSuccess={handleLoginSuccess}
        />

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onOpenLogin={() => {
            setIsRegisterModalOpen(false)
            setIsLoginModalOpen(true)
          }}
        />

        {/* Botón flotante para continuar reserva */}
        {selectedLab && activeTab === "browse" && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={handleContinueToReservation}
              className="bg-[#FFBF00] hover:bg-[#E6A800] text-white font-medium px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Continuar Reserva
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
