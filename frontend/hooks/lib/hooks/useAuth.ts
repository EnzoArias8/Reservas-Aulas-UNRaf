import { useEffect, useRef, useState } from "react"

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
  const lastRawRef = useRef<string | null>(null)

  const loadUser = () => {
    try {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }
      const raw = localStorage.getItem("currentUser")
      // Evitar setState si no cambió el contenido
      if (raw === lastRawRef.current) {
        setIsLoading(false)
        return
      }
      lastRawRef.current = raw
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

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return { user, isLoading }
}