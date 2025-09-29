"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Tipo para las reservas
interface Reservation {
  id: string
  labId: string
  date: string // formato YYYY-MM-DD
  timeSlot: string
  purpose: string
  attendees: string
  labName?: string
  building?: string
  floor?: string
  userId?: string
}

export default function MisReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  // Datos de laboratorios
  const labs = [
    {
      id: "chem-101",
      name: "Laboratorio de Química 101",
      building: "Edificio de Ciencias",
      floor: "1er Piso",
    },
    {
      id: "phys-202",
      name: "Laboratorio de Física 202",
      building: "Edificio de Ingeniería",
      floor: "2do Piso",
    },
    {
      id: "bio-103",
      name: "Laboratorio de Biología 103",
      building: "Edificio de Ciencias de la Vida",
      floor: "1er Piso",
    },
    {
      id: "comp-301",
      name: "Laboratorio de Informática 301",
      building: "Edificio de Tecnología",
      floor: "3er Piso",
    },
  ]

  // Cargar usuario actual
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setCurrentUser(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    } else {
      // Redirigir si no hay usuario autenticado
      router.push("/")
    }
  }, [router])

  // Cargar reservas del localStorage
  useEffect(() => {
    if (!currentUser) return

    const savedReservations = localStorage.getItem("labReservations")
    if (savedReservations) {
      const parsedReservations = JSON.parse(savedReservations)

      // Filtrar reservas del usuario actual
      const userReservations = parsedReservations.filter(
        (res: Reservation) => !res.userId || res.userId === currentUser.id,
      )

      // Enriquecer las reservas con información del laboratorio
      const enrichedReservations = userReservations.map((reservation: Reservation) => {
        const lab = labs.find((lab) => lab.id === reservation.labId)
        return {
          ...reservation,
          labName: lab?.name,
          building: lab?.building,
          floor: lab?.floor,
          userId: reservation.userId || currentUser.id, // Asegurar que tenga userId
        }
      })

      setReservations(enrichedReservations)
    }
  }, [currentUser])

  // Función para cancelar una reserva
  const cancelReservation = (id: string) => {
    // Obtener todas las reservas
    const savedReservations = localStorage.getItem("labReservations")
    if (savedReservations) {
      const allReservations = JSON.parse(savedReservations)

      // Filtrar la reserva a cancelar
      const updatedAllReservations = allReservations.filter((res: Reservation) => res.id !== id)

      // Guardar todas las reservas actualizadas
      localStorage.setItem("labReservations", JSON.stringify(updatedAllReservations))

      // Actualizar el estado local
      const updatedUserReservations = reservations.filter((res) => res.id !== id)
      setReservations(updatedUserReservations)

      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada correctamente.",
      })
    }
  }

  // Función para editar una reserva (redirige a la página principal con datos precargados)
  const editReservation = (reservation: Reservation) => {
    // En una aplicación real, aquí pasaríamos los datos a través de un estado global o parámetros
    // Por ahora, simplemente redirigimos a la página principal
    router.push("/")

    toast({
      title: "Editar reserva",
      description: "Serás redirigido para editar tu reserva.",
    })
  }

  // Filtrar reservas por pasadas y próximas
  const today = new Date().toISOString().split("T")[0]
  const upcomingReservations = reservations.filter((res) => res.date >= today)
  const pastReservations = reservations.filter((res) => res.date < today)

  // Verificar si una reserva puede ser editada (solo si es futura)
  const canEditReservation = (date: string) => {
    return date >= today
  }

  // Si no hay usuario, mostrar mensaje
  if (!currentUser) {
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

  return (
    <div className="container py-10">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>

      {reservations.length === 0 ? (
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
        <Tabs defaultValue="proximas">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="proximas" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Próximas Reservas ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="pasadas" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reservas Pasadas ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas">
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
                {upcomingReservations.map((reservation) => (
                  <Card key={reservation.id} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-primary" />
                            {reservation.labName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {reservation.building}, {reservation.floor}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge>Próxima</Badge>
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
                    <CardFooter className="flex justify-between border-t bg-slate-50 dark:bg-slate-800 p-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar tu reserva para el{" "}
                              {format(parseISO(reservation.date), "d 'de' MMMM", { locale: es })}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelReservation(reservation.id)}>
                              Sí, cancelar reserva
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editReservation(reservation)}
                        disabled={!canEditReservation(reservation.date)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pasadas">
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
                {pastReservations.map((reservation) => (
                  <Card key={reservation.id} className="overflow-hidden opacity-80">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-muted-foreground" />
                            {reservation.labName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {reservation.building}, {reservation.floor}
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
