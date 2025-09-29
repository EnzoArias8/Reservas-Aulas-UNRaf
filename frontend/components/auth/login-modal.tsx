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
  
const login = async (
  email: string,
  password: string,
  onClose: () => void,
  setIsLoading: (value: boolean) => void,
  setError: (msg: string) => void,
  setSuccess: (msg: string) => void
) => {
  setIsLoading(true)
  const validateForm = () => {
    if (!email.trim()) {
      return "El correo electrónico es requerido"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Por favor ingresa un correo electrónico válido"
    }

    if (!password) {
      return "La contraseña es requerida"
    }

    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }

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

  await login(
    email,
    password,
    onClose,
    setIsLoading,
    setError,
    setSuccess
  )
}


    setIsLoading(true)



  try {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // importante si usás cookies
      body: JSON.stringify({
        email: email, 
        password: password,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Error de autenticación")
    }

    const data = await res.json()

    // Guardar usuario y token (si estás usando localStorage)
    localStorage.setItem("accessToken", data.accessToken)
localStorage.setItem("currentUser", JSON.stringify({
  ...data.user,
  token: data.accessToken,
}));


    if (onLoginSuccess) {
      onLoginSuccess(data.user)
    }


    setSuccess("Inicio de sesión exitoso. Redirigiendo...")

    toast({
      title: "Bienvenido",
      description: "Has iniciado sesión correctamente",
      className: "bg-green-50 border-green-200 text-green-800",
    })

    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1500)
  } catch (error: any) {
    setError(error.message || "Ocurrió un error al iniciar sesión")

    toast({
      title: "Error al iniciar sesión",
      description: error.message || "Credenciales incorrectas",
      variant: "destructive",
      className: "bg-red-50 border-red-200 text-red-800",
    })
  } finally {
    setIsLoading(false)
  }
}
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setSuccess("")

  if (!email.trim()) {
    setError("El correo electrónico es requerido")
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    setError("Por favor ingresa un correo electrónico válido")
    return
  }

  if (!password || password.length < 6) {
    setError("La contraseña debe tener al menos 6 caracteres")
    return
  }

  // Ejecutar login
  await login(email, password, onClose, setIsLoading, setError, setSuccess)
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

        {/* Mensajes de error y éxito más visibles */}
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
