"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Calendar as CalendarIcon, Plus, Trash2, Edit, Clock, MapPin, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { axiosClient } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"

interface RecurringReservation {
  _id?: string
  labId: string
  labName: string
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
  { value: 0, label: "Domingo" }
]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
]

export default function RecurringReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<RecurringReservation[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    labId: "",
    dayOfWeek: 1,
    startTime: "18:00",
    endTime: "20:00",
    semester: "",
    purpose: "",
    attendees: 1
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar reservas recurrentes del usuario
      const reservationsRes = await axiosClient.get("/reservations/recurring")
      setReservations(reservationsRes.data?.data || reservationsRes.data || [])

      // Cargar aulas disponibles
      const labsRes = await axiosClient.get("/labs")
      setLabs(labsRes.data?.data || labsRes.data || [])

      // Cargar cuatrimestres activos
      const semestersRes = await axiosClient.get("/admin/semesters")
      setSemesters(semestersRes.data?.data || semestersRes.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear reservas",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await axiosClient.post("/reservations/recurring", formData)
      setReservations([...reservations, response.data])
      setFormData({
        labId: "",
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "20:00",
        semester: "",
        purpose: "",
        attendees: 1
      })
      setShowForm(false)
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

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/reservations/recurring/${id}`)
      setReservations(reservations.filter(r => r._id !== id))
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto py-10">
          <Alert>
            <AlertDescription>
              Debes iniciar sesión para acceder a las reservas recurrentes
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-10">
        <Toaster />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Reservas Recurrentes
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Programa tus clases regulares por cuatrimestre
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Mis Reservas Recurrentes</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva Recurrente
          </Button>
        </div>

        {/* Lista de Reservas Recurrentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reservations.map((reservation) => (
            <Card key={reservation._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{reservation.labName}</CardTitle>
                  <Badge variant={reservation.isActive ? "default" : "secondary"}>
                    {reservation.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <CardDescription>
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
                  <span>{reservation.building}</span>
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
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* Implementar edición */}}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(reservation._id!)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Formulario de Nueva Reserva Recurrente */}
        {showForm && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Nueva Reserva Recurrente</CardTitle>
              <CardDescription>
                Programa una clase regular que se repetirá cada semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lab">Aula</Label>
                    <Select
                      value={formData.labId}
                      onValueChange={(value) => setFormData({...formData, labId: value})}
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
                      value={formData.semester}
                      onValueChange={(value) => setFormData({...formData, semester: value})}
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
                      value={formData.dayOfWeek.toString()}
                      onValueChange={(value) => setFormData({...formData, dayOfWeek: parseInt(value)})}
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
                      value={formData.attendees}
                      onChange={(e) => setFormData({...formData, attendees: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Select
                      value={formData.startTime}
                      onValueChange={(value) => setFormData({...formData, startTime: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
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
                      value={formData.endTime}
                      onValueChange={(value) => setFormData({...formData, endTime: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
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
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    placeholder="Ej: Clase de Matemática I - Análisis"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Crear Reserva Recurrente
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}













