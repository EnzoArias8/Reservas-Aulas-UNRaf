"use client"

import type React from "react"
import { useState } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { axiosClient } from "@/lib/api"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenRegister: () => void
  onLoginSuccess?: (userData: any) => void
}

export function LoginModal({ isOpen, onClose, onOpenRegister, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validaciones
    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido")
      return
    }

    if (!password) {
      setError("La contraseña es requerida")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      // Llamar al backend
      const response = await axiosClient.post("/auth/login", {
        email: email.trim(),
        password: password,
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

      setSuccess("Inicio de sesión exitoso. Redirigiendo...")

      toast({
        title: "Bienvenido",
        description: `Has iniciado sesión como ${data.user.nombre}`,
        className: "bg-green-50 border-green-200 text-green-800",
      })

      // Llamar callback si existe
      if (onLoginSuccess) {
        onLoginSuccess({
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
      const errorMessage = error.response?.data?.message || error.message || "Error al iniciar sesión"
      setError(errorMessage)

      toast({
        title: "Error al iniciar sesión",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Iniciar Sesión
          </DialogTitle>
          <DialogDescription>Ingresa tus credenciales para acceder al sistema de reservas.</DialogDescription>
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
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-medium">
                Correo Electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@universidad.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                  if (success) setSuccess("")
                }}
                disabled={isLoading}
                className={error && !email.trim() ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="font-medium">
                Contraseña *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError("")
                  if (success) setSuccess("")
                }}
                disabled={isLoading}
                className={error && password.length < 6 ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose()
                onOpenRegister()
              }}
              disabled={isLoading}
              className="sm:order-1 order-2"
            >
              Crear Cuenta
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="sm:order-2 order-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}