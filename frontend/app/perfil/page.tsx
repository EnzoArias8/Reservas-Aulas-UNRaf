"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  User,
  Mail,
  School,
  Calendar,
  Shield,
  AlertCircle,
  LogOut,
  Lock,
  Phone,
  GraduationCap,
  BookOpen,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthService } from "@/lib/services/auth"

interface UserData {
  _id: string
  nombre: string
  apellido: string
  email: string
  role?: string
  telefono?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export default function PerfilPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserData | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const router = useRouter()

  // Función para obtener iniciales del usuario (como Google)
  const getUserInitials = () => {
    if (!userData) {
      console.log("🔍 No userData found in profile")
      return "U"
    }
    
    console.log("🔍 UserData in profile:", userData)
    
    // Si tiene nombre y apellido separados
    if (userData.nombre && userData.apellido) {
      const initials = `${userData.nombre.charAt(0)}${userData.apellido.charAt(0)}`.toUpperCase()
      console.log("🔍 Profile initials from nombre/apellido:", initials)
      return initials
    }
    
    // Si tiene name completo, tomar primera letra de cada palabra
    if (userData.name) {
      const names = userData.name.trim().split(' ')
      if (names.length >= 2) {
        const initials = `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
        console.log("🔍 Profile initials from name:", initials)
        return initials
      }
      const initial = userData.name.charAt(0).toUpperCase()
      console.log("🔍 Single initial from name:", initial)
      return initial
    }
    
    console.log("🔍 No name found in profile, returning U")
    return "U"
  }

  // Función para obtener color de fondo basado en las iniciales (colores de las aulas)
  const getAvatarColor = () => {
    if (!userData) {
      console.log("🔍 No userData for color, using default")
      return "bg-gradient-to-br from-[#FFBF00] to-[#FFBF00]"
    }
    
    const initials = getUserInitials()
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Usar los 3 colores de las aulas: naranja, teal, azul
    const colors = [
      "bg-gradient-to-br from-[#FFBF00] to-[#FFBF00]", // Naranja-amarillo
      "bg-gradient-to-br from-[#00AAAA] to-[#00AAAA]", // Teal/cyan
      "bg-gradient-to-br from-[#336699] to-[#336699]"  // Azul medio
    ]
    
    const selectedColor = colors[hash % colors.length]
    console.log("🔍 Profile avatar color:", selectedColor, "for initials:", initials)
    return selectedColor
  }

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Cargar datos actualizados desde el backend
        const user = await AuthService.getCurrentUser()
        setUserData(user)
        setFormData(user)
        
        // Actualizar localStorage con los datos más recientes
        localStorage.setItem("currentUser", JSON.stringify(user))
      } catch (error) {
        console.error("Error loading user data:", error)
        // Fallback a localStorage si falla la llamada al backend
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            setUserData(parsedUser)
            setFormData(parsedUser)
          } catch (parseError) {
            console.error("Error parsing stored user data:", parseError)
          }
        }
      }
    }

    loadUserData()
  }, [])

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (!storedUser) {
      router.push("/")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return

    const { name, value } = e.target
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleSave = async () => {
    if (!formData) return

    try {
      // Enviar cambios al backend
      const updatedUser = await AuthService.updateProfile({
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      })

      // Actualizar el estado local
      setUserData(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      setIsEditing(false)

      toast({
        title: "Perfil actualizado",
        description: "Tus datos personales han sido actualizados correctamente.",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error)
      toast({
        title: "Error al actualizar perfil",
        description: error?.response?.data?.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setFormData(userData)
    setIsEditing(false)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async () => {
    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "La nueva contraseña y la confirmación no coinciden.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      await AuthService.changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      // Limpiar los campos
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      toast({
        title: "Error al cambiar contraseña",
        description: error?.response?.data?.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
      className: "bg-blue-50 border-blue-200 text-blue-800",
    })
    router.push("/")
  }

  const handleDeleteAccount = () => {
    localStorage.removeItem("currentUser")
    toast({
      title: "Cuenta eliminada",
      description: "Tu cuenta ha sido eliminada correctamente.",
      variant: "destructive",
    })
    router.push("/")
  }

  // Si no hay usuario, mostrar mensaje
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container py-10">
          <Toaster />
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-full bg-yellow-100 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Acceso no autorizado</h3>
              <p className="text-muted-foreground text-center mb-6">Debes iniciar sesión para acceder a esta página.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container py-10">
        <Toaster />
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Gestiona tu información personal y configuración</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
                    <AvatarImage src="" alt={`${userData.nombre} ${userData.apellido}`} />
                    <AvatarFallback className={`text-2xl text-white font-semibold ${getAvatarColor()}`}>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-center text-xl">{userData.nombre} {userData.apellido}</CardTitle>
                  <CardDescription className="text-center">{userData.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800 dark:text-blue-300"
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      {userData.role || "Usuario"}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {userData.createdAt && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Registro:</span>
                        <span className="ml-auto font-medium">
                          {new Date(userData.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {/* Botón de Cerrar Sesión */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 bg-transparent"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder
                        a tu cuenta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Sí, cerrar sesión
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Botón de Eliminar Cuenta */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Eliminar Cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y todas tus reservas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2">
            <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/20 shadow-xl">
              <Tabs defaultValue="informacion" className="w-full flex flex-col items-center">
                <TabsList className="grid grid-cols-2 mx-auto mt-6 mb-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 w-full max-w-md">
                  <TabsTrigger
                    value="informacion"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 font-medium"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Información Personal
                  </TabsTrigger>
                  <TabsTrigger
                    value="seguridad"
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Seguridad
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="informacion" className="w-full px-6">
                  <div className="max-w-4xl mx-auto">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Información Personal
                      </CardTitle>
                      <CardDescription>Actualiza tu información personal y de contacto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre" className="font-medium">
                            <User className="h-4 w-4 inline mr-2" />
                            Nombre
                          </Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            value={formData?.nombre || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="apellido" className="font-medium">
                            <User className="h-4 w-4 inline mr-2" />
                            Apellido
                          </Label>
                          <Input
                            id="apellido"
                            name="apellido"
                            value={formData?.apellido || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-medium">
                            <Mail className="h-4 w-4 inline mr-2" />
                            Correo Electrónico
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            value={formData?.email || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefono" className="font-medium">
                            <Phone className="h-4 w-4 inline mr-2" />
                            Teléfono
                          </Label>
                          <Input
                            id="telefono"
                            name="telefono"
                            value={formData?.telefono || ""}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder={isEditing ? "Ingresa tu teléfono" : "No especificado"}
                            className="bg-white dark:bg-slate-800"
                          />
                        </div>

                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={handleCancel}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-cyan-600 to-cyan-600 hover:from-cyan-700 hover:to-cyan-700"
                          >
                            Guardar Cambios
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700"
                        >
                          Editar Información
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  </div>
                </TabsContent>

                <TabsContent value="seguridad" className="w-full px-6">
                  <div className="max-w-4xl mx-auto">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-600" />
                        Seguridad
                      </CardTitle>
                      <CardDescription>Administra tu contraseña y la seguridad de tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="font-medium">
                          <Lock className="h-4 w-4 inline mr-2" />
                          Contraseña Actual
                        </Label>
                        <Input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="bg-white dark:bg-slate-800"
                          placeholder="Ingresa tu contraseña actual"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="font-medium">
                          Nueva Contraseña
                        </Label>
                        <Input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="bg-white dark:bg-slate-800"
                          placeholder="Ingresa tu nueva contraseña"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="font-medium">
                          Confirmar Nueva Contraseña
                        </Label>
                        <Input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="bg-white dark:bg-slate-800"
                          placeholder="Confirma tu nueva contraseña"
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-700 disabled:opacity-50"
                      >
                        {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                      </Button>
                    </CardFooter>
                  </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
