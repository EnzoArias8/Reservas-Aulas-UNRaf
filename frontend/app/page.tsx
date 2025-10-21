"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { TimeRangePicker } from "@/components/time-range-picker"
import { LabCard } from "@/components/lab-card"
import { ReservationConfirmation } from "@/components/reservation-confirmation"
import { format } from "date-fns"
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("browse")
  const [createdReservation, setCreatedReservation] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Estados para preservar datos del formulario durante login
  const [pendingFormData, setPendingFormData] = useState<any>(null)
  const [pendingSelectedLab, setPendingSelectedLab] = useState<string | null>(null)
  const [pendingDate, setPendingDate] = useState<Date | undefined>(undefined)
  
  // Estados para filtros
  const [buildingFilter, setBuildingFilter] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [equipmentFilter, setEquipmentFilter] = useState("")

  // ✅ HOOKS REALES - Reemplaza localStorage y simulaciones
  const { user, isAuthenticated, loadUser } = useAuth()
  const createReservationMutation = useCreateReservation()
  const { data: editReservation, isLoading: isLoadingEditReservation } = useReservationById(editReservationId)

  // ✅ Cargar usuario al inicializar solo una vez
  const hasLoadedUser = useRef(false)
  useEffect(() => {
    if (!hasLoadedUser.current) {
      hasLoadedUser.current = true
      loadUser()
    }
  }, [])

  // ✅ Verificar autenticación en cada render para debug
  useEffect(() => {
    console.log("🔍 Auth state changed - isAuthenticated:", isAuthenticated, "user:", user)
    const token = localStorage.getItem("accessToken")
    console.log("🔍 Token in localStorage:", !!token)
    
    // Si no hay token pero el estado dice que está autenticado, limpiar el estado
    if (!token && isAuthenticated) {
      console.log("🧹 Cleaning auth state - no token but authenticated")
      // Limpiar completamente el localStorage
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken") 
      localStorage.removeItem("currentUser")
      // Forzar recarga para limpiar el estado persistido
      window.location.reload()
    }
  }, [isAuthenticated, user])

  // ✅ Cargar aulas desde API - Solo las activas para la vista pública
  const { data: allLabs = [], isLoading: labsLoading } = useLabs({ isActive: true })

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
  const { data: availableTimeSlots = [], isLoading: slotsLoading } = useAvailableTimeSlots(
    selectedLab || "",
    date ? format(date, "yyyy-MM-dd") : "",
  )

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
      setSelectedLab(editReservation.lab?._id || "")
      setDate(new Date(editReservation.date))
      setActiveTab("reserve")
      
      // Precargar el formulario con los datos de la reserva
      form.reset({
        labId: editReservation.lab?._id || "",
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
    
    // Verificar autenticación - triple verificación estricta
    const hasToken = localStorage.getItem("accessToken")
    const hasUser = localStorage.getItem("currentUser")
    
    if (!isAuthenticated || !user || !hasToken || !hasUser) {
      console.log("❌ Not authenticated - isAuthenticated:", isAuthenticated, "user:", user, "hasToken:", hasToken, "hasUser:", hasUser)
      
      // Limpiar estado inconsistente
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
      setCreatedReservation(reservation)
      setShowConfirmation(true)

      toast({
        title: "Reserva creada exitosamente",
        description: `Tu reserva para el ${format(values.date, "dd/MM/yyyy")} ha sido confirmada`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Limpiar formulario
      form.reset()
      setSelectedLab(null)
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-10">
        <Toaster />

        {/* Header con gradiente y fondo */}
        <div className="text-center mb-10">
          <div
            className="inline-block w-full min-h-[25rem] bg-cover bg-center bg-no-repeat
                       flex flex-col justify-start items-center pt-6"
            style={{ backgroundImage: "url('/fondo.png')" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-600 px-6 py-3 rounded-lg" style={{ WebkitTextStroke: '2px #fbbf24' }}>
              {isEditing ? 'Editar Reserva' : 'Reserva de Aulas'}
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
        ) : showConfirmation && createdReservation ? (
          <ReservationConfirmation
            lab={labs.find((lab: any) => lab._id === selectedLab)}
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
            }}
          />
        ) : (
          <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/20 shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 m-6 mb-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600">
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
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Continuar Reserva
                </TabsTrigger>
              </TabsList>

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
                        colorClass = "from-[#FFBF00] to-[#FFBF00]"
                        break
                      case 1: // Segunda columna - teal/cyan
                        colorClass = "from-[#00AAAA] to-[#00AAAA]"
                        break
                      case 2: // Tercera columna - azul medio
                        colorClass = "from-[#336699] to-[#336699]"
                        break
                      default:
                        colorClass = "from-blue-500 to-purple-500"
                    }
                    
                    return (
                      <LabCard
                        key={lab._id}
                        lab={{...lab, color: colorClass}}
                        onSelect={() => {
                          setSelectedLab(lab._id)
                          form.setValue("labId", lab._id)
                        }}
                        isSelected={selectedLab === lab._id}
                      />
                    )
                  })}
                </div>

                {selectedLab && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleContinueToReservation}
                      className="bg-gradient-to-r from-yellow-700 to-yellow-700 hover:from-yellow-700 hover:to-yellow-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      Continuar a la Reserva
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reserve" className="p-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-500 text-white rounded-t-lg">
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
                      <Alert className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
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
                                    onSelect={(date) => {
                                      field.onChange(date)
                                      setDate(date)
                                    }}
                                    disabled={(date) =>
                                      date < new Date() ||
                                      date > new Date(new Date().setMonth(new Date().getMonth() + 3)) ||
                                      date.getDay() === 0 ||
                                      date.getDay() === 6
                                    }
                                    className="rounded-md border bg-white dark:bg-slate-800"
                                  />
                                  <FormDescription className="text-blue-600 dark:text-blue-400">
                                    Selecciona un día de semana dentro de los próximos 3 meses
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-6">
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                              <FormField
                                control={form.control}
                                name="timeSlot"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-purple-800 dark:text-purple-200 font-medium">
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
                                        selectedTimeSlot={field.value}
                                        onSelectTimeSlot={field.onChange}
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

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
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
                                      Capacidad máxima: {labs.find((lab: any) => lab._id === selectedLab)?.capacity || "N/A"}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
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
                                    placeholder="Describe el propósito de tu reserva de aula (opcional)"
                                    className="resize-none bg-white dark:bg-slate-800"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-orange-600 dark:text-orange-400">
                                  Describe brevemente el proyecto o actividad que planeas realizar (opcional)
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
                              (availableTimeSlots.length === 0 && !!date && !slotsLoading) ||
                              !isAuthenticated ||
                              createReservationMutation.isPending
                            }
                            className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-medium px-8 shadow-lg hover:shadow-xl transition-all duration-200"
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
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
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
