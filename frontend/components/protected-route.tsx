'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[]; // Opcional: roles permitidos
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('currentUser');

      // Si no hay token o usuario, redirigir a home
      if (!token || !userStr) {
        router.push('/');
        return;
      }

      // Si se requiere un rol específico, verificar
      if (requiredRole && requiredRole.length > 0) {
        try {
          const user = JSON.parse(userStr);
          
          if (!requiredRole.includes(user.role)) {
            // Usuario no tiene el rol requerido
            router.push('/');
            return;
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          router.push('/');
          return;
        }
      }

      // Todo OK
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  // Mostrar loading mientras se verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Si no está autorizado, no mostrar nada (ya redirigió)
  return null;
}