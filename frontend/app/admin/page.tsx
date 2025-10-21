"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { useLabs, useCreateLab, useUpdateLab } from "@/lib/hooks/use-labs"
import { useReservations } from "@/lib/hooks/use-reservations"
import { axiosClient } from "@/lib/api"

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("labs")

  return (
    <ProtectedRoute requiredRole={["Admin"]}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Panel de Administración</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="labs">Aulas</TabsTrigger>
            <TabsTrigger value="reservations">Reservas</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="labs" className="mt-6">
            <LabsAdmin />
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <ReservationsAdmin />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

function LabsAdmin() {
  const { data: labs = [], isLoading } = useLabs()
  const createLab = useCreateLab()
  const updateLab = useUpdateLab()
  const [q, setQ] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: "", building: "Campus E4", floor: "Planta Baja", capacity: 10, equipment: "", isActive: true })

  const filtered = useMemo(() => {
    let result = q 
      ? labs.filter((l: any) =>
          [l.name, l.building, l.floor].some((v: string) => v?.toLowerCase().includes(q.toLowerCase())),
        )
      : labs
    
    // Ordenar por edificio y luego por nombre (numérico si es posible)
    return result.sort((a: any, b: any) => {
      // Primero ordenar por edificio
      if (a.building !== b.building) {
        return a.building.localeCompare(b.building)
      }
      
      // Luego ordenar por nombre
      // Extraer el número del nombre si existe (ej: "Aula 5" -> 5)
      const aMatch = a.name.match(/\d+/)
      const bMatch = b.name.match(/\d+/)
      
      if (aMatch && bMatch) {
        // Ambos tienen números, comparar numéricamente
        const aNum = parseInt(aMatch[0])
        const bNum = parseInt(bMatch[0])
        return aNum - bNum
      }
      
      // Si no tienen números o solo uno tiene, ordenar alfabéticamente
      return a.name.localeCompare(b.name)
    })
  }, [q, labs])

  const toggleActive = async (lab: any) => {
    try {
      await updateLab.mutateAsync({ 
        id: lab._id, 
        data: { isActive: !lab.isActive } 
      })
      toast({ 
        title: lab.isActive ? "Aula desactivada" : "Aula activada", 
        description: lab.isActive 
          ? "El aula ya no estará disponible para reservas" 
          : "El aula ahora está disponible para reservas"
      })
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "No se pudo cambiar el estado", 
        variant: "destructive" 
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aulas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={() => { setEditing(null); setForm({ name: "", building: "Campus E4", floor: "Planta Baja", capacity: 10, equipment: "", isActive: true }); setIsOpen(true) }}>
            Añadir Aula
          </Button>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Edificio / Campus</th>
                  <th>Nombre</th>
                  <th>Piso</th>
                  <th>Capacidad</th>
                  <th>Equipamiento</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l._id} className={`border-b ${!l.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="py-2">{l.building}</td>
                    <td>{l.name}</td>
                    <td>{l.floor}</td>
                    <td>{l.capacity}</td>
                    <td className="max-w-xs truncate" title={Array.isArray(l.equipment) ? l.equipment.join(', ') : l.equipment}>
                      {Array.isArray(l.equipment) && l.equipment.length > 0 
                        ? l.equipment.join(', ') 
                        : l.equipment || 'Sin equipamiento'}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        l.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {l.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="flex gap-2 justify-end py-2">
                      <Button size="sm" onClick={() => { setEditing(l); setForm({ name: l.name || "", building: l.building || "Campus E4", floor: l.floor || "Planta Baja", capacity: l.capacity || 10, equipment: (l.equipment||[]).join(', '), isActive: !!l.isActive }); setIsOpen(true) }}>Editar</Button>
                      <Button 
                        variant={l.isActive ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => toggleActive(l)}
                      >
                        {l.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Aula" : "Crear Aula"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Edificio / Campus</Label>
                  <Select value={form.building} onValueChange={(value) => setForm({ ...form, building: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Campus E4">Campus E4</SelectItem>
                      <SelectItem value="Campus LAB">Campus LAB</SelectItem>
                      <SelectItem value="Edificio 1 (Bv. Roca)">Edificio 1 (Bv. Roca)</SelectItem>
                      <SelectItem value="Rivadavia">Rivadavia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Piso</Label>
                  <Select value={form.floor} onValueChange={(value) => setForm({ ...form, floor: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un piso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planta Baja">Planta Baja</SelectItem>
                      <SelectItem value="Planta Alta">Planta Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Nombre del Aula/Laboratorio</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Aula 1, Lab. Informática, etc."
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Equipamiento (separado por comas)</Label>
                <Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={async () => {
                const payload: any = { name: form.name.trim(), building: form.building.trim(), floor: form.floor.trim(), capacity: form.capacity, equipment: form.equipment ? form.equipment.split(',').map(s=>s.trim()).filter(Boolean) : [], isActive: form.isActive }
                if (!payload.name) { toast({ title: "Falta nombre", variant: "destructive" }); return }
                try {
                  if (editing) {
                    await updateLab.mutateAsync({ id: editing._id, data: payload })
                    toast({ title: "Aula actualizada" })
                  } else {
                    await createLab.mutateAsync(payload)
                    toast({ title: "Aula creada" })
                  }
                  setIsOpen(false)
                } catch (e: any) {
                  toast({ title: "Error", description: e?.message || "Error", variant: "destructive" })
                }
              }}>{editing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function ReservationsAdmin() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    purpose: "",
    attendees: "",
    status: "confirmed"
  })

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const res = await axiosClient.get(`/reservations?${params.toString()}`)
      console.log('Reservations response:', res.data)
      setReservations(res.data?.data || res.data)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast({ title: "Error", description: "No se pudieron cargar las reservas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let filtered = reservations
    if (q) {
      filtered = filtered.filter((r: any) =>
        [r?.lab?.name, r?.timeSlot, r?.purpose].some((v: string) => v?.toLowerCase().includes(q.toLowerCase())),
      )
    }
    return filtered
  }, [q, reservations])

  const cancelReservation = async (id: string) => {
    try {
      await axiosClient.put(`/reservations/${id}/cancel`)
      await fetchReservations()
      toast({ title: "Reserva cancelada" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Error", variant: "destructive" })
    }
  }

  const deleteReservation = async (id: string) => {
    try {
      await axiosClient.delete(`/reservations/${id}`)
      await fetchReservations()
      toast({ title: "Reserva eliminada definitivamente" })
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.response?.data?.message || e?.message || "Error al eliminar la reserva", 
        variant: "destructive" 
      })
    }
  }

  const editReservation = (reservation: any) => {
    setEditing(reservation)
    setForm({
      date: reservation.date || "",
      timeSlot: reservation.timeSlot || "",
      purpose: reservation.purpose || "",
      attendees: reservation.attendees?.toString() || "",
      status: reservation.status || "confirmed"
    })
    setIsOpen(true)
  }

  const updateReservation = async () => {
    if (!editing) return
    
    try {
      await axiosClient.put(`/reservations/${editing._id}`, {
        date: form.date,
        timeSlot: form.timeSlot,
        purpose: form.purpose,
        attendees: parseInt(form.attendees),
        status: form.status
      })
      await fetchReservations()
      setIsOpen(false)
      setEditing(null)
      toast({ title: "Reserva actualizada" })
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "Error al actualizar la reserva"
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      })
    }
  }

  // Cargar reservas automáticamente al montar el componente
  useEffect(() => {
    fetchReservations()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2"
          >
            <option value="">Todos los estados</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
          </select>
          <Button onClick={() => { setEditing(null); setForm({ date: "", timeSlot: "", purpose: "", attendees: "", status: "confirmed" }); setIsOpen(true) }}>
            Crear Reserva
          </Button>
          <Button onClick={fetchReservations} variant="outline">Refrescar</Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Fecha</th>
                  <th>Horario</th>
                  <th>Aula</th>
                  <th>Edificio</th>
                  <th>Email Usuario</th>
                  <th>Asistentes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r._id} className="border-b">
                    <td className="py-2">{r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}</td>
                    <td>{r.timeSlot || 'N/A'}</td>
                    <td>
                      {r.labId && typeof r.labId === 'object' && r.labId.name ? 
                        r.labId.name : 
                        (typeof r.labId === 'string' ? r.labId : 'N/A')
                      }
                    </td>
                    <td>
                      {r.labId && typeof r.labId === 'object' ? 
                        r.labId.building || 'N/A' :
                        'N/A'
                      }
                    </td>
                    <td>
                      {r.userId && typeof r.userId === 'object' ? 
                        r.userId.email || 'N/A' :
                        'N/A'
                      }
                    </td>
                    <td>{r.attendees || 0}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${
                        r.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editReservation(r)}
                        >
                          Editar
                        </Button>
                        {r.status === 'confirmed' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Cancelar
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
                                  <span>{r.labId?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Edificio:</span>
                                  <span>{r.labId?.building || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Fecha:</span>
                                  <span>{new Date(r.date).toLocaleDateString('es-ES')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Horario:</span>
                                  <span>{r.timeSlot}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Asistentes:</span>
                                  <span>{r.attendees}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Usuario:</span>
                                  <span>{r.userId && typeof r.userId === 'object' ? r.userId.email || 'N/A' : 'N/A'}</span>
                                </div>
                                {r.purpose && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">Propósito:</span>
                                    <span className="text-right max-w-[200px] break-words">{r.purpose}</span>
                                  </div>
                                )}
                              </div>
                              
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">No, mantener reserva</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => cancelReservation(r._id)}
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Cancelar reserva
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : r.status === 'completed' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[500px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro de eliminar definitivamente esta reserva completada?</AlertDialogTitle>
                              </AlertDialogHeader>
                              
                              {/* Datos de la reserva */}
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">Aula/Laboratorio:</span>
                                  <span>{r.labId?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Edificio:</span>
                                  <span>{r.labId?.building || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Fecha:</span>
                                  <span>{new Date(r.date).toLocaleDateString('es-ES')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Horario:</span>
                                  <span>{r.timeSlot}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Asistentes:</span>
                                  <span>{r.attendees}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">Usuario:</span>
                                  <span>{r.userId && typeof r.userId === 'object' ? r.userId.email || 'N/A' : 'N/A'}</span>
                                </div>
                                {r.purpose && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">Propósito:</span>
                                    <span className="text-right max-w-[200px] break-words">{r.purpose}</span>
                                  </div>
                                )}
                              </div>
                              
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">No, mantener reserva</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteReservation(r._id)}
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Eliminar definitivamente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Al cambiar la fecha o horario, se verificará que no haya conflictos con otras reservas.
              </p>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha</Label>
                  <Input 
                    type="date" 
                    value={form.date} 
                    onChange={(e) => setForm({ ...form, date: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Horario</Label>
                  <Input 
                    value={form.timeSlot} 
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    placeholder="Ej: 08:00 - 10:00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Asistentes</Label>
                  <Input 
                    type="number" 
                    value={form.attendees} 
                    onChange={(e) => setForm({ ...form, attendees: e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Propósito</Label>
                <Input 
                  value={form.purpose} 
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Descripción del propósito de la reserva"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={updateReservation}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function UsersAdmin() {
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", role: "Profesor", password: "" })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      const res = await axiosClient.get(`/users?${params.toString()}`)
      setUsers(res.data?.data || res.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, data: any) => {
    try {
      console.log('Actualizando usuario:', id, 'con datos:', data)
      const response = await axiosClient.put(`/users/${id}`, data)
      console.log('Respuesta del servidor:', response.data)
      await fetchUsers()
      toast({ title: "Usuario actualizado" })
    } catch (e: any) {
      console.error('Error al actualizar usuario:', e)
      toast({ title: "Error", description: e?.message || "Error", variant: "destructive" })
    }
  }

  const toggleActive = async (user: any) => {
    try {
      await axiosClient.put(`/users/${user._id}`, { isActive: !user.isActive })
      await fetchUsers()
      toast({ 
        title: user.isActive ? "Usuario desactivado" : "Usuario activado",
        description: user.isActive 
          ? "El usuario no podrá acceder al sistema" 
          : "El usuario ahora puede acceder al sistema"
      })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Error", variant: "destructive" })
    }
  }

  // Cargar usuarios automáticamente al montar el componente
  useEffect(() => {
    fetchUsers()
  }, [])

  // Cargar usuarios cuando cambie la búsqueda (con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (q.length >= 2 || q.length === 0) {
        fetchUsers()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [q])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Buscar por nombre/email/facultad" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
          <Button onClick={() => { setEditing(null); setForm({ nombre: "", apellido: "", email: "", telefono: "", role: "Profesor", password: "" }); setIsOpen(true) }}>
            Crear Usuario
          </Button>
          <Button onClick={fetchUsers} variant="outline">Refrescar</Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={`border-b ${!u.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="py-2">{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{u.telefono || 'N/A'}</td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => updateUser(u._id, { role: e.target.value })}
                        className="text-sm border rounded px-1"
                        disabled={u.role === 'Admin'}
                      >
                        <option value="Profesor">Profesor</option>
                        <option value="Investigador">Investigador</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        u.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="flex gap-2 py-2">
                      <Button 
                        size="sm" 
                        onClick={() => { 
                          setEditing(u); 
                          setForm({ nombre: u.nombre || "", apellido: u.apellido || "", email: u.email || "", telefono: u.telefono || "", role: u.role || "Profesor", password: "" }); 
                          setIsOpen(true) 
                        }}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant={u.isActive ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} />
              </div>
              {!editing && (
                <div>
                  <Label>Contraseña</Label>
                  <Input 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    placeholder="Contraseña para el usuario"
                  />
                </div>
              )}
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Número de teléfono" />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Profesor">Profesor</SelectItem>
                    <SelectItem value="Investigador">Investigador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={async () => {
                if (!form.nombre || !form.apellido || !form.email) {
                  toast({ title: "Error", description: "Por favor complete todos los campos requeridos", variant: "destructive" })
                  return
                }
                if (!editing && !form.password) {
                  toast({ title: "Error", description: "Por favor ingrese una contraseña para el usuario", variant: "destructive" })
                  return
                }
                try {
                  if (editing) {
                    // Editar usuario existente
                    await updateUser(editing._id, { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, role: form.role })
                  } else {
                    // Crear nuevo usuario
                    await axiosClient.post('/users', { 
                      nombre: form.nombre, 
                      apellido: form.apellido, 
                      email: form.email, 
                      telefono: form.telefono, 
                      role: form.role,
                      password: form.password
                    })
                    toast({ title: "Usuario creado exitosamente" })
                  }
                  await fetchUsers()
                  setIsOpen(false)
                  setEditing(null)
                } catch (e: any) {
                  toast({ title: "Error", description: e?.response?.data?.message || e?.message || "Error", variant: "destructive" })
                }
              }}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}


