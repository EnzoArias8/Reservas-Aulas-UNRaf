"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"

import { Toaster } from "../../components/ui/toaster"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useUserReservations, useCancelReservation } from "../../lib/hooks/useReservations"
import { useAuth } from "../../lib/hooks/useAuth"
import { Reservation } from "../../lib/types"
import { axiosClient } from "../../lib/api"
import { toast } from "../../components/ui/use-toast"
import {
  CalendarIcon,
  ClockIcon,
  FlaskConical,
  Building2,
  Users,
  Trash2,
  PencilIcon,
  AlertCircle,
  Clock,
  Calendar,
  Loader2,
  Plus,
  Edit,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface RecurringReservation {
  _id?: string
  labId: string
  labName?: string
  lab?: { name: string; building: string }
  dayOfWeek: number // 0 = Domingo, 1 = Lunes, etc.
  startTime: string
  endTime: string
  semester: string
  purpose: string
  attendees: number
  isActive: boolean
  createdAt: string
}

interface Lab {
  _id: string
  name: string
  building: string
  capacity: number
}

interface Semester {
  _id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  // Domingo eliminado para reservas recurrentes
]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
]

export default function MisReservasPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data, isLoading, error, refetch } = useUserReservations({ enabled: !!user })
  
  // Estados para reservas recurrentes
  const [recurringReservations, setRecurringReservations] = useState<RecurringReservation[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recurringLoading, setRecurringLoading] = useState(false)

  const [recurringFormData, setRecurringFormData] = useState({
    labId: "",
    dayOfWeek: 1,
    startTime: "18:00",
    endTime: "20:00",
    semester: "",
    purpose: "",
    attendees: 1
  })

  // Derivar opciones de fin en función de la hora de inicio seleccionada y restricciones de sábado
  const isSaturday = recurringFormData.dayOfWeek === 6
  const startTimeOptions = isSaturday
    ? TIME_SLOTS.filter((t) => t >= "08:00" && t < "12:00")
    : TIME_SLOTS
  const endTimeOptions = TIME_SLOTS.filter((t) => {
    if (t <= recurringFormData.startTime) return false
    if (isSaturday && t > "12:00") return false
    return true
  })
  
  // Debug: Log de las reservas para verificar los datos
  console.log('Reservas del usuario:', data)
  const { mutate: cancelReservation, isPending: isCancelling } = useCancelReservation(() => {
    // Recargar las reservas después de cancelar
    if (refetch) refetch()
  })

  // Cargar datos de reservas recurrentes
  useEffect(() => {
    if (user && user.role === "Profesor") {
      loadRecurringData()
    }
  }, [user])

  const loadRecurringData = async () => {
    setRecurringLoading(true)
    try {
      // Cargar reservas recurrentes del usuario
      const reservationsRes = await axiosClient.get("/reservations/recurring")
      setRecurringReservations(reservationsRes.data?.data || reservationsRes.data || [])

      // Cargar aulas disponibles
      const labsRes = await axiosClient.get("/labs")
      setLabs(labsRes.data?.data || labsRes.data || [])

      // Cargar cuatrimestres activos
      const semestersRes = await axiosClient.get("/admin/semesters")
      setSemesters(semestersRes.data?.data || semestersRes.data || [])
    } catch (error) {
      console.error("Error loading recurring data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de reservas recurrentes",
        variant: "destructive"
      })
    } finally {
      setRecurringLoading(false)
    }
  }

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear reservas",
        variant: "destructive"
      })
      return
    }

    // Validar campos requeridos
    if (!recurringFormData.labId || !recurringFormData.semester) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    // Validar capacidad del aula
    const lab = labs.find(l => l._id === recurringFormData.labId)
    if (lab && recurringFormData.attendees > lab.capacity) {
      toast({
        title: "Capacidad excedida",
        description: `El aula tiene capacidad máxima de ${lab.capacity} asistentes` ,
        variant: "destructive"
      })
      return
    }

    try {
      await axiosClient.post("/reservations/recurring", recurringFormData)
      
      // Recargar los datos de reservas recurrentes
      await loadRecurringData()
      
      // Resetear formulario
      setRecurringFormData({
        labId: "",
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "20:00",
        semester: "",
        purpose: "",
        attendees: 1
      })
      setShowRecurringForm(false)
      
      toast({
        title: "Reserva recurrente creada",
        description: "Tu reserva recurrente se ha creado exitosamente"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la reserva recurrente",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    try {
      await axiosClient.delete(`/reservations/recurring/${id}`)
      setRecurringReservations(recurringReservations.filter(r => r._id !== id))
      toast({
        title: "Reserva eliminada",
        description: "La reserva recurrente se ha eliminado exitosamente"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la reserva",
        variant: "destructive"
      })
    }
  }

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || "Desconocido"
  }

  const getSemesterName = (semesterId: string) => {
    const semester = semesters.find(s => s._id === semesterId)
    return semester?.name || "Cuatrimestre no encontrado"
  }

  // Función para editar una reserva (redirige a la página principal con datos precargados)
  const editReservation = (reservation: Reservation) => {
    // Redirige a la página principal con el ID de la reserva para editar
    router.push(`/?edit=${reservation._id}`)
  }

  // Filtrar reservas por pasadas y próximas
  const upcomingReservations = data?.upcoming || []
  const pastReservations = data?.past || []

  // Verificar si una reserva puede ser editada (solo si es futura)
  const canEditReservation = (date: string) => {
    const reservationDate = parseISO(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Asegurar que comparamos solo la fecha, no la hora
    return reservationDate >= today
  }

  // Si no hay usuario, mostrar mensaje
  if (isAuthLoading) {
    return (
      <div className="container py-10 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Toaster />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-yellow-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Acceso no autorizado</h3>
            <p className="text-muted-foreground text-center mb-6">Debes iniciar sesión para acceder a esta página.</p>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading && !data) {
    return (
      <div className="container py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#336699] dark:text-[#4A8FCC] mb-2">
            Mis Reservas
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona todas tus reservas de aulas
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando reservas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="container py-10 text-destructive">Error al cargar las reservas: {error.message}</div>
  }

  return (
    <div className="container py-10">
      <Toaster />
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-[#336699] dark:text-[#4A8FCC] mb-2">
          Mis Reservas
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestiona todas tus reservas de aulas
        </p>
      </div>

      {upcomingReservations.length === 0 && pastReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-yellow-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">No tienes reservas</h3>
            <p className="text-muted-foreground text-center mb-6">
              Aún no has realizado ninguna reserva de laboratorio.
            </p>
            <Button asChild>
              <Link href="/">Hacer una Reserva</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="proximas" className="w-full flex flex-col items-center">
          <TabsList className={`grid ${user?.role === "Profesor" ? "grid-cols-3" : "grid-cols-2"} mx-auto mb-8 bg-slate-200 dark:bg-slate-700 w-full max-w-2xl rounded-xl p-1 shadow-lg`}>
            <TabsTrigger value="proximas" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md font-medium rounded-lg transition-all duration-200 hover:bg-primary/20">
              <Clock className="h-4 w-4" />
              Próximas Reservas ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="pasadas" className="flex items-center gap-2 data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-md font-medium rounded-lg transition-all duration-200 hover:bg-secondary/20">
              <Calendar className="h-4 w-4" />
              Reservas Pasadas ({pastReservations.length})
            </TabsTrigger>
            {user?.role === "Profesor" && (
              <TabsTrigger value="recurrentes" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-md font-medium rounded-lg transition-all duration-200 hover:bg-accent/20">
                <CalendarIcon className="h-4 w-4" />
                Recurrentes ({recurringReservations.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="proximas" className="w-full px-6">
            <div className="max-w-7xl mx-auto">
              {upcomingReservations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="rounded-full bg-yellow-100 p-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No tienes reservas próximas</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      No tienes reservas programadas para fechas futuras.
                    </p>
                    <Button asChild>
                      <Link href="/">Hacer una Reserva</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingReservations.map((reservation: Reservation) => (
                  <Card key={reservation._id} className="overflow-hidden border border-primary/20 dark:border-primary/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-800">
                    <CardHeader className="bg-slate-100 dark:bg-slate-700 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-primary" />
                            {reservation.lab?.name || 'Laboratorio no especificado'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {reservation.lab?.building || 'N/D'}, {reservation.lab?.floor || 'N/D'}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge className="bg-primary text-white shadow-md">Próxima</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(parseISO(reservation.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.timeSlot}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.attendees} asistentes</span>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-1">Propósito:</h4>
                          <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-slate-50 dark:bg-slate-800 p-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200">
                            <Trash2 className="h-4 w-4 mr-1" />
                            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[500px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro que quiere cancelar esta reserva?</AlertDialogTitle>
                          </AlertDialogHeader>
                          
                          {/* Datos de la reserva */}
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Aula/Laboratorio:</span>
                              <span>{reservation.lab?.name || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Edificio:</span>
                              <span>{reservation.lab?.building || 'N/D'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Fecha:</span>
                              <span>{format(parseISO(reservation.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Horario:</span>
                              <span>{reservation.timeSlot}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Asistentes:</span>
                              <span>{reservation.attendees}</span>
                            </div>
                            {reservation.purpose && (
                              <div className="flex justify-between">
                                <span className="font-medium">Propósito:</span>
                                <span className="text-right max-w-[200px] break-words">{reservation.purpose}</span>
                              </div>
                            )}
                          </div>
                          
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">No, mantener reserva</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => cancelReservation(reservation._id)}
                              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                            >
                              Cancelar reserva
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editReservation(reservation)}
                        disabled={!canEditReservation(reservation.date)}
                        className="border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pasadas" className="w-full px-6">
            <div className="max-w-7xl mx-auto">
              {pastReservations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="rounded-full bg-yellow-100 p-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No tienes reservas pasadas</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      No has realizado reservas en fechas anteriores.
                    </p>
                    <Button asChild>
                      <Link href="/">Hacer una Reserva</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastReservations.map((reservation: Reservation) => (
                  <Card key={reservation._id} className="overflow-hidden opacity-80">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-muted-foreground" />
                            {reservation.lab?.name || 'Laboratorio no especificado'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {reservation.lab?.building || 'N/D'}, {reservation.lab?.floor || 'N/D'}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Pasada</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(parseISO(reservation.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.timeSlot}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.attendees} asistentes</span>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-1">Propósito:</h4>
                          <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Reservas Recurrentes - Solo para Profesores */}
          {user?.role === "Profesor" && (
            <TabsContent value="recurrentes" className="w-full px-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-[#336699] dark:text-[#4A8FCC]">
                                          </h2>
                    <p className="text-muted-foreground mt-1"></p>
                  </div>
                </div>

                {recurringLoading ? null : recurringReservations.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <div className="rounded-full bg-yellow-100 p-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-medium mb-2">No tienes reservas recurrentes</h3>
                      <p className="text-muted-foreground text-center mb-6">
                  
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recurringReservations.map((reservation) => (
                      <Card key={reservation._id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-800 border border-accent/20 dark:border-accent/30">
                        <CardHeader className="bg-slate-100 dark:bg-slate-700">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-accent font-semibold">{reservation.lab?.name || reservation.labName}</CardTitle>
                            <Badge variant={reservation.isActive ? "default" : "secondary"} className={reservation.isActive ? "bg-accent text-white shadow-md" : ""}>
                              {reservation.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          <CardDescription className="text-muted-foreground font-medium">
                            {getSemesterName(reservation.semester)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{getDayName(reservation.dayOfWeek)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.startTime} - {reservation.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.lab?.building || labs.find(l => l._id === reservation.labId)?.building || 'N/D'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{reservation.attendees} asistentes</span>
                          </div>
                          {reservation.purpose && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {reservation.purpose}
                            </p>
                          )}
                          <div className="flex gap-2 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowRecurringForm(true)
                                setRecurringFormData({
                                  labId: reservation.labId,
                                  dayOfWeek: reservation.dayOfWeek,
                                  startTime: reservation.startTime,
                                  endTime: reservation.endTime,
                                  semester: reservation.semester,
                                  purpose: reservation.purpose,
                                  attendees: reservation.attendees,
                                })
                              }}
                              className="border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRecurring(reservation._id!)}
                              className="bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Formulario de Nueva Reserva Recurrente */}
                {showRecurringForm && (
                  <Card className="max-w-2xl mx-auto mt-8 border border-primary/20 dark:border-primary/30 shadow-xl bg-white dark:bg-slate-800">
                    <CardHeader className="bg-slate-100 dark:bg-slate-700">
                      <CardTitle className="text-2xl font-bold text-[#336699] dark:text-[#4A8FCC]">
                        Nueva Reserva Recurrente
                      </CardTitle>
                      <CardDescription className="text-base">
                        Programa una clase regular que se repetirá cada semana
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRecurringSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lab">Aula</Label>
                            <Select
                              value={recurringFormData.labId}
                              onValueChange={(value) => setRecurringFormData({...recurringFormData, labId: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar aula" />
                              </SelectTrigger>
                              <SelectContent>
                                {labs.map((lab) => (
                                  <SelectItem key={lab._id} value={lab._id}>
                                    {lab.name} - {lab.building} (Cap: {lab.capacity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="semester">Cuatrimestre</Label>
                            <Select
                              value={recurringFormData.semester}
                              onValueChange={(value) => setRecurringFormData({...recurringFormData, semester: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cuatrimestre" />
                              </SelectTrigger>
                              <SelectContent>
                                {semesters.map((semester) => (
                                  <SelectItem key={semester._id} value={semester._id}>
                                    {semester.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="dayOfWeek">Día de la Semana</Label>
                            <Select
                              value={recurringFormData.dayOfWeek.toString()}
                              onValueChange={(value) => setRecurringFormData({...recurringFormData, dayOfWeek: parseInt(value)})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar día" />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                  <SelectItem key={day.value} value={day.value.toString()}>
                                    {day.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="attendees">Número de Asistentes</Label>
                            <Input
                              id="attendees"
                              type="number"
                              min="1"
                              value={recurringFormData.attendees}
                              onChange={(e) => setRecurringFormData({...recurringFormData, attendees: parseInt(e.target.value)})}
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="startTime">Hora de Inicio</Label>
                            <Select
                              value={recurringFormData.startTime}
                              onValueChange={(value) => setRecurringFormData({...recurringFormData, startTime: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar hora" />
                              </SelectTrigger>
                              <SelectContent>
                                {startTimeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="endTime">Hora de Fin</Label>
                            <Select
                              value={recurringFormData.endTime}
                              onValueChange={(value) => setRecurringFormData({...recurringFormData, endTime: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar hora" />
                              </SelectTrigger>
                              <SelectContent>
                                {endTimeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="purpose">Propósito de la Clase</Label>
                          <Input
                            id="purpose"
                            value={recurringFormData.purpose}
                            onChange={(e) => setRecurringFormData({...recurringFormData, purpose: e.target.value})}
                            placeholder="Ej: Clase de Matemática I - Análisis"
                          />
                        </div>

                        <div className="flex gap-3 pt-6">
                          <Button 
                            type="submit" 
                            className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            Crear Reserva Recurrente
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowRecurringForm(false)}
                            className="border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
