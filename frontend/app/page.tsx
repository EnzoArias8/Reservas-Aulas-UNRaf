"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { TimeSlotPicker } from "@/components/time-slot-picker"
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
import { useCreateReservation } from "@/lib/hooks/use-reservations"
import { useAvailableTimeSlots } from "@/lib/hooks/use-labs"

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
  purpose: z.string().min(10, {
    message: "El propósito debe tener al menos 10 caracteres",
  }),
  attendees: z.string().min(1, {
    message: "Por favor ingresa el número de asistentes",
  }),
})

export default function LabReservationPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedLab, setSelectedLab] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("browse")
  const [createdReservation, setCreatedReservation] = useState<any>(null)

  // ✅ HOOKS REALES - Reemplaza localStorage y simulaciones
  const { user, isAuthenticated } = useAuth()
  const createReservationMutation = useCreateReservation()

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

  // ✅ FUNCIÓN REAL - Reemplaza completamente las simulaciones
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Verificar autenticación
    if (!isAuthenticated || !user) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para hacer una reserva",
        variant: "destructive",
      })
      setIsLoginModalOpen(true)
      return
    }

    try {
      // 🚀 LLAMADA REAL A LA API usando el hook
      const reservation = await createReservationMutation.mutateAsync({
        labId: values.labId,
        date: format(values.date, "yyyy-MM-dd"),
        timeSlot: values.timeSlot,
        purpose: values.purpose,
        attendees: Number.parseInt(values.attendees),
      })

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
      console.error("Error creating reservation:", error)

      toast({
        title: "Error al crear reserva",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      })
    }
  }

  // ✅ DATOS REALES - Estos deberían venir de una API también
  const labs = [
    {
      id: "a1-e4",
      name: "Aula 1",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a2-e4",
      name: "Aula 2",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a3-e4",
      name: "Aula 3",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a4-e4",
      name: "Aula 4",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a5-e4",
      name: "Aula 5",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a6-e4",
      name: "Aula 6",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a7-e4",
      name: "Aula 7",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a8-e4",
      name: "Aula 8",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a9-e4",
      name: "Aula 9",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a10-e4",
      name: "Aula 10",
      building: "Edificio 4",
      floor: "1er Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a11-e4",
      name: "Aula 11",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a12-e4",
      name: "Aula 12",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a13-e4",
      name: "Aula 13",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a14-e4",
      name: "Aula 14",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a15-e4",
      name: "Aula 15",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a16-e4",
      name: "Aula 16",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a17-e4",
      name: "Aula 17",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
    {
      id: "a18-e4",
      name: "Aula 18",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-blue-900 to-blue-900",
    },
    {
      id: "a19-e4",
      name: "Aula 19",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-yellow-500 to-yellow-500",
    },
    {
      id: "a20-e4",
      name: "Aula 20",
      building: "Edificio 4",
      floor: "2do Piso",
      capacity: 60,
      equipment: ["Proyector"],
      color: "from-cyan-600 to-cyan-600",
    },
  ]

  const timeSlots = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00",
    "16:00 - 18:00",
    "18:00 - 20:00",
    "20:00 - 22:00",
  ]

  // Función para continuar a la reserva
  const handleContinueToReservation = () => {
    if (selectedLab) {
      setActiveTab("reserve")
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
            <h1 className="text-5xl md:text-6xl font-bold text-white px-6 py-3 rounded-lg">Reserva de Aulas</h1>
            <p className="text-xl text-white mt-2">Universidad Nacional de Rafaela</p>
          </div>
        </div>

        {showConfirmation && createdReservation ? (
          <ReservationConfirmation
            reservation={createdReservation}
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
                  Hacer Reserva
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {labs.map((lab) => (
                    <LabCard
                      key={lab.id}
                      lab={lab}
                      onSelect={() => {
                        setSelectedLab(lab.id)
                        form.setValue("labId", lab.id)
                      }}
                      isSelected={selectedLab === lab.id}
                    />
                  ))}
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
                      {selectedLab ? labs.find((lab) => lab.id === selectedLab)?.name : "un aula"} para tus necesidades
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
                                      <TimeSlotPicker
                                        timeSlots={timeSlots}
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
                                        max={labs.find((lab) => lab.id === selectedLab)?.capacity || 60}
                                        className="bg-white dark:bg-slate-800"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-green-600 dark:text-green-400">
                                      Capacidad máxima: {labs.find((lab) => lab.id === selectedLab)?.capacity || "N/A"}
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
                                  Propósito de la Reserva
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe el propósito de tu reserva de aula"
                                    className="resize-none bg-white dark:bg-slate-800"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-orange-600 dark:text-orange-400">
                                  Describe brevemente el proyecto o actividad que planeas realizar
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
                              "Enviar Reserva"
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
        />

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onOpenLogin={() => {
            setIsRegisterModalOpen(false)
            setIsLoginModalOpen(true)
          }}
        />
      </div>
    </div>
  )
}
