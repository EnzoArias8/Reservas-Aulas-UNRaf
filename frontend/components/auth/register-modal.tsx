"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { axiosClient } from "@/lib/api"

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin: () => void
  onRegisterSuccess?: (userData: any) => void 
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenLogin, 
  onRegisterSuccess 
}) => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
    role: "Estudiante",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const validateForm = () => {
    if (!formData.nombre.trim()) return "El nombre es requerido"
    if (!formData.email.trim()) return "El correo electrónico es requerido"
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) return "Correo electrónico inválido"
    
    if (!formData.password) return "La contraseña es requerida"
    if (formData.password.length < 6) return "La contraseña debe tener al menos 6 caracteres"
    if (!formData.confirmPassword) return "Confirma tu contraseña"
    if (formData.password !== formData.confirmPassword) return "Las contraseñas no coinciden"
    if (!formData.faculty.trim()) return "La facultad es requerida"
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      // Llamar al backend
      const response = await axiosClient.post("/auth/register", {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        faculty: formData.faculty,
        role: formData.role,
      })

      const { data } = response.data

      // Guardar tokens y usuario en localStorage
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("currentUser", JSON.stringify({
        id: data.user._id,
        name: data.user.nombre,
        email: data.user.email,
        faculty: data.user.faculty,
        role: data.user.role,
        isLoggedIn: true,
      }))

      setSuccess("Cuenta creada exitosamente")
      
      toast({
        title: "Registro exitoso",
        description: `Bienvenido ${data.user.nombre}`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Llamar callback si existe
      if (onRegisterSuccess) {
        onRegisterSuccess({
          id: data.user._id,
          name: data.user.nombre,
          email: data.user.email,
          faculty: data.user.faculty,
          role: data.user.role,
          isLoggedIn: true,
        })
      }

      // Cerrar modal y recargar después de un momento
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1500)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Error al registrarse"
      setError(errorMessage)
      
      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Crear Cuenta
          </DialogTitle>
          <DialogDescription>Completa el formulario para crear una cuenta.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input 
                  id="nombre" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  placeholder="juan@universidad.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Repite tu contraseña"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="faculty">Facultad *</Label>
                <Input 
                  id="faculty" 
                  name="faculty" 
                  value={formData.faculty} 
                  onChange={handleChange} 
                  disabled={isLoading}
                  placeholder="Ej: Ingeniería"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleSelectChange("role", value)} 
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estudiante">Estudiante</SelectItem>
                    <SelectItem value="Profesor">Profesor</SelectItem>
                    <SelectItem value="Investigador">Investigador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose()
                onOpenLogin()
              }}
              disabled={isLoading}
            >
              Ya tengo cuenta
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
