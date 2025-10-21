"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useLabs, useCreateLab, useDeleteLab } from "@/lib/hooks/use-labs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function AdminLabsPage() {
  const { data: labs = [], isLoading } = useLabs()
  const createLab = useCreateLab()
  const deleteLab = useDeleteLab()

  const [name, setName] = useState("")
  const [building, setBuilding] = useState("")
  const [floor, setFloor] = useState("")
  const [capacity, setCapacity] = useState<number>(30)
  const [equipment, setEquipment] = useState<string>("")

  const handleCreate = async () => {
    const payload = {
      name,
      building,
      floor,
      capacity: Number(capacity),
      equipment: equipment
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      isActive: true,
    }

    await createLab.mutateAsync(payload as any)
    setName("")
    setBuilding("")
    setFloor("")
    setCapacity(30)
    setEquipment("")
  }

  return (
    <ProtectedRoute requiredRole={["Admin"]}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Administración de Aulas</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aula 101" />
                </div>
                <div>
                  <Label>Edificio</Label>
                  <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Edificio 1" />
                </div>
                <div>
                  <Label>Piso</Label>
                  <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Planta Baja" />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={capacity}
                    min={1}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Equipamiento (separado por comas)</Label>
                  <Input
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="Proyector, Pizarrón, PCs"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createLab.isPending}>
                {createLab.isPending ? "Creando..." : "Crear Aula"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listado de Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : labs.length === 0 ? (
                <p className="text-muted-foreground">No hay aulas cargadas.</p>
              ) : (
                <div className="space-y-3">
                  {labs.map((lab: any) => (
                    <div key={lab._id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <p className="font-medium">{lab.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lab.building} • {lab.floor} • <Badge variant="secondary">{lab.capacity}</Badge>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteLab.mutateAsync(lab._id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}


