"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Calendar as CalendarIcon, Plus, Trash2, Edit, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { axiosClient } from "@/lib/api"

interface Semester {
  _id?: string
  name: string
  startDate: string
  endDate: string
  year: number
  isActive: boolean
}

interface ExamWeek {
  _id?: string
  name: string
  startDate: string
  endDate: string
  semester: string
}

interface Holiday {
  _id?: string
  name: string
  date: string
  type: 'national' | 'academic' | 'university'
  description?: string
}

export default function CalendarManagementPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [examWeeks, setExamWeeks] = useState<ExamWeek[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("semesters")

  // Estados para formularios
  const [semesterForm, setSemesterForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    year: new Date().getFullYear(),
    isActive: false
  })

  const [examWeekForm, setExamWeekForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    semester: ""
  })

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "national" as 'national' | 'academic' | 'university',
    description: ""
  })

  // Cargar datos
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar cuatrimestres
      const semestersRes = await axiosClient.get("/admin/semesters")
      setSemesters(semestersRes.data?.data || semestersRes.data || [])

      // Cargar semanas de examen
      const examWeeksRes = await axiosClient.get("/admin/exam-weeks")
      setExamWeeks(examWeeksRes.data?.data || examWeeksRes.data || [])

      // Cargar feriados
      const holidaysRes = await axiosClient.get("/admin/holidays")
      setHolidays(holidaysRes.data?.data || holidaysRes.data || [])
    } catch (error) {
      console.error("Error loading calendar data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del calendario",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Gestión de cuatrimestres
  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axiosClient.post("/admin/semesters", semesterForm)
      setSemesters([...semesters, response.data])
      setSemesterForm({ name: "", startDate: "", endDate: "", year: new Date().getFullYear(), isActive: false })
      toast({
        title: "Cuatrimestre creado",
        description: "El cuatrimestre se ha creado exitosamente"
      })
      // Recargar datos para asegurar consistencia
      await loadData()
    } catch (error: any) {
      console.error("Error creating semester:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear el cuatrimestre",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSemester = async (id: string) => {
    try {
      await axiosClient.delete(`/admin/semesters/${id}`)
      setSemesters(semesters.filter(s => s._id !== id))
      toast({
        title: "Cuatrimestre eliminado",
        description: "El cuatrimestre se ha eliminado exitosamente"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar el cuatrimestre",
        variant: "destructive"
      })
    }
  }

  // Gestión de semanas de examen
  const handleCreateExamWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axiosClient.post("/admin/exam-weeks", examWeekForm)
      setExamWeeks([...examWeeks, response.data])
      setExamWeekForm({ name: "", startDate: "", endDate: "", semester: "" })
      toast({
        title: "Semana de examen creada",
        description: "La semana de examen se ha creado exitosamente"
      })
      // Recargar datos para asegurar consistencia
      await loadData()
    } catch (error: any) {
      console.error("Error creating exam week:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la semana de examen",
        variant: "destructive"
      })
    }
  }

  const handleDeleteExamWeek = async (id: string) => {
    try {
      await axiosClient.delete(`/admin/exam-weeks/${id}`)
      setExamWeeks(examWeeks.filter(ew => ew._id !== id))
      toast({
        title: "Semana de examen eliminada",
        description: "La semana de examen se ha eliminado exitosamente"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar la semana de examen",
        variant: "destructive"
      })
    }
  }

  // Gestión de feriados
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axiosClient.post("/admin/holidays", holidayForm)
      setHolidays([...holidays, response.data])
      setHolidayForm({ name: "", date: "", type: "national", description: "" })
      toast({
        title: "Feriado creado",
        description: "El feriado se ha creado exitosamente"
      })
      // Recargar datos para asegurar consistencia
      await loadData()
    } catch (error: any) {
      console.error("Error creating holiday:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear el feriado",
        variant: "destructive"
      })
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    try {
      await axiosClient.delete(`/admin/holidays/${id}`)
      setHolidays(holidays.filter(h => h._id !== id))
      toast({
        title: "Feriado eliminado",
        description: "El feriado se ha eliminado exitosamente"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar el feriado",
        variant: "destructive"
      })
    }
  }

  // Función para traducir el tipo de feriado
  const translateHolidayType = (type: string) => {
    const translations: { [key: string]: string } = {
      'national': 'Nacional',
      'academic': 'Académico',
      'university': 'Universitario'
    }
    return translations[type] || type
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto py-10">
        <Toaster />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#336699] dark:text-[#4A8FCC]">
            Gestión de Calendario Académico
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Administra cuatrimestres, semanas de examen y feriados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-8">
            <TabsTrigger value="semesters">Cuatrimestres</TabsTrigger>
            <TabsTrigger value="exam-weeks">Semanas de Examen</TabsTrigger>
            <TabsTrigger value="holidays">Feriados</TabsTrigger>
          </TabsList>

          {/* Gestión de Cuatrimestres */}
          <TabsContent value="semesters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Crear Cuatrimestre
                </CardTitle>
                <CardDescription>
                  Define los períodos académicos del año
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSemester} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="semester-name">Nombre del Cuatrimestre</Label>
                      <Input
                        id="semester-name"
                        value={semesterForm.name}
                        onChange={(e) => setSemesterForm({...semesterForm, name: e.target.value})}
                        placeholder="Ej: Primer Cuatrimestre 2024"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester-year">Año</Label>
                      <Input
                        id="semester-year"
                        type="number"
                        value={semesterForm.year}
                        onChange={(e) => setSemesterForm({...semesterForm, year: parseInt(e.target.value)})}
                        min={2020}
                        max={2030}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester-start">Fecha de Inicio</Label>
                      <Input
                        id="semester-start"
                        type="date"
                        value={semesterForm.startDate}
                        onChange={(e) => setSemesterForm({...semesterForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="semester-end">Fecha de Fin</Label>
                      <Input
                        id="semester-end"
                        type="date"
                        value={semesterForm.endDate}
                        onChange={(e) => setSemesterForm({...semesterForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="semester-active"
                      checked={semesterForm.isActive}
                      onChange={(e) => setSemesterForm({...semesterForm, isActive: e.target.checked})}
                    />
                    <Label htmlFor="semester-active">Cuatrimestre Activo</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Cuatrimestre
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Cuatrimestres */}
            <Card>
              <CardHeader>
                <CardTitle>Cuatrimestres Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {semesters.map((semester) => (
                    <div key={semester._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{semester.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(semester.startDate), "dd/MM/yyyy", { locale: es })} - {format(new Date(semester.endDate), "dd/MM/yyyy", { locale: es })}
                        </p>
                        {semester.isActive && (
                          <Badge className="mt-2 bg-green-100 text-green-800">Activo</Badge>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSemester(semester._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestión de Semanas de Examen */}
          <TabsContent value="exam-weeks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Crear Semana de Examen
                </CardTitle>
                <CardDescription>
                  Define las semanas de mesas de examen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateExamWeek} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exam-name">Nombre de la Semana</Label>
                      <Input
                        id="exam-name"
                        value={examWeekForm.name}
                        onChange={(e) => setExamWeekForm({...examWeekForm, name: e.target.value})}
                        placeholder="Ej: Mesas de Examen - Primer Cuatrimestre"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam-semester">Cuatrimestre</Label>
                      <select
                        id="exam-semester"
                        value={examWeekForm.semester}
                        onChange={(e) => setExamWeekForm({...examWeekForm, semester: e.target.value})}
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
                      <Label htmlFor="exam-start">Fecha de Inicio</Label>
                      <Input
                        id="exam-start"
                        type="date"
                        value={examWeekForm.startDate}
                        onChange={(e) => setExamWeekForm({...examWeekForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam-end">Fecha de Fin</Label>
                      <Input
                        id="exam-end"
                        type="date"
                        value={examWeekForm.endDate}
                        onChange={(e) => setExamWeekForm({...examWeekForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Semana de Examen
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Semanas de Examen */}
            <Card>
              <CardHeader>
                <CardTitle>Semanas de Examen Configuradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examWeeks.map((examWeek) => (
                    <div key={examWeek._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{examWeek.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(examWeek.startDate), "dd/MM/yyyy", { locale: es })} - {format(new Date(examWeek.endDate), "dd/MM/yyyy", { locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteExamWeek(examWeek._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestión de Feriados */}
          <TabsContent value="holidays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Crear Feriado
                </CardTitle>
                <CardDescription>
                  Define los días no laborables de la universidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateHoliday} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="holiday-name">Nombre del Feriado</Label>
                      <Input
                        id="holiday-name"
                        value={holidayForm.name}
                        onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})}
                        placeholder="Ej: Día de la Independencia"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="holiday-date">Fecha</Label>
                      <Input
                        id="holiday-date"
                        type="date"
                        value={holidayForm.date}
                        onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="holiday-type">Tipo de Feriado</Label>
                      <select
                        id="holiday-type"
                        value={holidayForm.type}
                        onChange={(e) => setHolidayForm({...holidayForm, type: e.target.value as any})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="national">Nacional</option>
                        <option value="academic">Académico</option>
                        <option value="university">Universitario</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="holiday-description">Descripción (Opcional)</Label>
                      <Input
                        id="holiday-description"
                        value={holidayForm.description}
                        onChange={(e) => setHolidayForm({...holidayForm, description: e.target.value})}
                        placeholder="Descripción del feriado"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Feriado
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Feriados */}
            <Card>
              <CardHeader>
                <CardTitle>Feriados Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holidays.map((holiday) => (
                    <div key={holiday._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{holiday.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "dd/MM/yyyy", { locale: es })} - {translateHolidayType(holiday.type)}
                        </p>
                        {holiday.description && (
                          <p className="text-xs text-muted-foreground mt-1">{holiday.description}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteHoliday(holiday._id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}






