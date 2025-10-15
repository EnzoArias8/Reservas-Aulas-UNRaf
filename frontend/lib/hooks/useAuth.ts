import { useEffect, useState } from "react"

type User = {
  _id?: string
  name?: string
  email?: string
  // agrega otros campos según tu backend
} | null

export function useAuth() {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Lee usuario desde localStorage (ajusta según cómo guardes el token/usuario)
    try {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }
      const raw = localStorage.getItem("user")
      if (raw) {
        setUser(JSON.parse(raw))
      } else {
        setUser(null)
      }
    } catch (e) {
      console.error("useAuth: error leyendo localStorage", e)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { user, isLoading }
}