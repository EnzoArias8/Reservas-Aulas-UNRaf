"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, Calendar, LogOut, Home, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginModal } from "@/components/auth/login-modal"
import { RegisterModal } from "@/components/auth/register-modal"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface UserData {
  id: string
  name: string
  email: string
  isLoggedIn: boolean
  [key: string]: any
}

export function Header() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const router = useRouter()

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  // Función para obtener iniciales del usuario (como Google)
  const getUserInitials = () => {
    if (!user) return "U"
    
    // Si tiene nombre y apellido separados
    if (user.nombre && user.apellido) {
      return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase()
    }
    
    // Si tiene name completo, tomar primera letra de cada palabra
    if (user.name) {
      const names = user.name.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
      }
      return user.name.charAt(0).toUpperCase()
    }
    
    return "U"
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setUser(null)
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })
    router.push("/")
  }

  const routes = [
    {
      href: "/",
      label: "Inicio",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/mis-reservas",
      label: "Mis Reservas",
      icon: Calendar,
      active: pathname === "/mis-reservas",
      requiresAuth: true,
    },
    {
      href: "/perfil",
      label: "Mi Perfil",
      icon: User,
      active: pathname === "/perfil",
      requiresAuth: true,
    },
  ]

  const isAdmin = user?.role === "Admin"

  // Filtrar rutas según si el usuario está autenticado
  const filteredRoutes = routes.filter((route) => !route.requiresAuth || user)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <nav className="grid gap-2 text-lg font-medium">
                {filteredRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent",
                      route.active && "bg-accent",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.label}
                  </Link>
                ))}

                {!user && (
                  <Button
                    className="mt-2"
                    onClick={() => {
                      setIsOpen(false)
                      setIsLoginModalOpen(true)
                    }}
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/unraflogo.png"
              alt="Logo UNRAF"
              className="h-8 w-auto" // Ajustá el tamaño según necesites
            />
            <span className="font-bold text-xl hidden md:inline-block"></span>
            <span className="font-bold text-xl md:hidden">SisLab</span>
          </Link>
        </div>


        <nav className="hidden md:flex items-center gap-6">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground",
              )}
            >
              Administrar
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role || "Usuario"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-reservas" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Mis Reservas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                Registrarse
              </Button>
              <Button size="sm" onClick={() => setIsLoginModalOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modales de autenticación */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsLoginModalOpen(false);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onRegisterSuccess={(userData) => {
        setUser(userData)
        setIsRegisterModalOpen(false)
      }}
      />
    </header>
  )
}
