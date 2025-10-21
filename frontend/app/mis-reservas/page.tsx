"use client"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
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
import { useUserReservations, useCancelReservation } from "../../lib/hooks/useReservations" // Corregido: ruta relativa
import { useAuth } from "../../lib/hooks/useAuth" // Corregido: usar ruta relativa (antes alias "@/...")
import { Reservation } from "../../lib/types" // Corregido: ruta relativa
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MisReservasPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data, isLoading, error } = useUserReservations({ enabled: !!user })
  
  // Debug: Log de las reservas para verificar los datos
  console.log('Reservas del usuario:', data)
  const { mutate: cancelReservation, isPending: isCancelling } = useCancelReservation()

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
        <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skeleton Loaders */}
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted"></Card>
          ))}
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
      <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>

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
          <TabsList className="grid grid-cols-2 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 w-full max-w-md">
            <TabsTrigger value="proximas" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 font-medium">
              <Clock className="h-4 w-4" />
              Próximas Reservas ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="pasadas" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium">
              <Calendar className="h-4 w-4" />
              Reservas Pasadas ({pastReservations.length})
            </TabsTrigger>
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
                  <Card key={reservation._id} className="overflow-hidden border border-blue-200 dark:border-blue-800">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-primary" />
                            {reservation.lab?.name || 'Laboratorio no especificado'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {reservation.lab?.building || 'N/A'}, {reservation.lab?.floor || 'N/A'}
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
                              <span>{reservation.lab?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Edificio:</span>
                              <span>{reservation.lab?.building || 'N/A'}</span>
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
                              {reservation.lab?.building || 'N/A'}, {reservation.lab?.floor || 'N/A'}
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
        </Tabs>
      )}
    </div>
  )
}
