import { useEffect, useState } from "react"

type User = {
  _id?: string
  id?: string
  name?: string
  nombre?: string
  apellido?: string
  email?: string
  role?: string
  faculty?: string
  isLoggedIn?: boolean
  // agrega otros campos según tu backend
} | null

export function useAuth() {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = () => {
    try {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }
      const raw = localStorage.getItem("currentUser")
      if (raw) {
        const userData = JSON.parse(raw)
        setUser({
          _id: userData.id || userData._id,
          id: userData.id || userData._id,
          name: userData.name,
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          role: userData.role,
          faculty: userData.faculty,
          isLoggedIn: userData.isLoggedIn
        })
      } else {
        setUser(null)
      }
    } catch (e) {
      console.error("useAuth: error leyendo localStorage", e)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
    
    // Escuchar cambios en el localStorage
    const handleStorageChange = () => {
      loadUser()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // También verificar periódicamente (para cambios en la misma pestaña)
    const interval = setInterval(loadUser, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return { user, isLoading }
}