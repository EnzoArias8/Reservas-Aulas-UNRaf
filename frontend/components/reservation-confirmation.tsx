"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, CheckCircle, ClockIcon, FlaskConical, Users, Copy } from "lucide-react"
import { Lab } from "@/lib/types"

interface ReservationConfirmationProps {
  lab: Lab | undefined
  date: Date
  timeSlot: string
  purpose: string
  attendees: string
  reservationId: string // Recibe el ID real desde el backend
  onClose: () => void
}

export function ReservationConfirmation({
  lab,
  date,
  timeSlot,
  purpose,
  attendees,
  reservationId,
  onClose,
}: ReservationConfirmationProps) {
  if (!lab) return null

  return (
    <div className="flex justify-center items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Reserva Confirmada</CardTitle>
              <CardDescription>Tu laboratorio ha sido reservado exitosamente</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-medium text-lg mb-3">Detalles de la Reserva</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FlaskConical className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{lab.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lab.building}, {lab.floor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-sm text-muted-foreground">
                      {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ClockIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hora</p>
                    <p className="text-sm text-muted-foreground">{timeSlot}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Asistentes</p>
                    <p className="text-sm text-muted-foreground">{attendees} personas</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-1">Propósito</p>
                  <p className="text-sm text-muted-foreground">{purpose}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">ID de Reserva</h3>
                <p className="text-sm text-muted-foreground">{reservationId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(reservationId)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4">
            <p className="text-sm">
              <span className="font-medium">Importante:</span> Por favor llega 10 minutos antes de tu horario
              programado. Si necesitas cancelar, hazlo con al menos 24 horas de anticipación.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={onClose}>
            Explorar Aulas
          </Button>
          <Button onClick={() => window.print()}>Imprimir Confirmación</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
