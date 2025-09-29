# Sistema de Reserva de Laboratorios

Sistema profesional de reserva de laboratorios universitarios construido con Next.js 14, TypeScript y TanStack Query.

## 🏗️ Arquitectura

### Frontend
- **Next.js 14** con App Router
- **TypeScript** para type safety
- **TanStack Query** para manejo de estado del servidor
- **Zustand** para estado global de autenticación
- **Tailwind CSS** + **shadcn/ui** para UI
- **React Hook Form** + **Zod** para formularios

### Backend (Para implementar)
El sistema está preparado para trabajar con cualquier backend que implemente los siguientes endpoints:

## 📡 API Endpoints Requeridos

### Autenticación
\`\`\`
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/profile
POST /api/auth/change-password
POST /api/auth/refresh
\`\`\`

### Laboratorios
\`\`\`
GET    /api/labs
GET    /api/labs/:id
GET    /api/labs/:id/available-slots?date=YYYY-MM-DD
POST   /api/labs
PUT    /api/labs/:id
DELETE /api/labs/:id
\`\`\`

### Reservas
\`\`\`
GET    /api/reservations
GET    /api/reservations/:id
GET    /api/reservations/me
GET    /api/reservations/user/:userId
POST   /api/reservations
PUT    /api/reservations/:id
PUT    /api/reservations/:id/cancel
DELETE /api/reservations/:id
\`\`\`

## 🚀 Instalación

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
\`\`\`

## 🔧 Variables de Entorno

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
├── app/                    # App Router de Next.js
├── components/            # Componentes reutilizables
├── lib/
│   ├── types.ts          # Tipos TypeScript
│   ├── api.ts            # Cliente HTTP
│   ├── services/         # Servicios de API
│   └── hooks/            # Hooks personalizados
└── README.md
\`\`\`

## 🔌 Integración con Backend

### 1. Tipos de Datos
Todos los tipos están definidos en `lib/types.ts`. El backend debe retornar datos que coincidan con estas interfaces.

### 2. Servicios de API
Los servicios en `lib/services/` manejan todas las llamadas HTTP. Cada servicio corresponde a una entidad del sistema.

### 3. Hooks de React Query
Los hooks en `lib/hooks/` proporcionan:
- Cache automático
- Revalidación en background
- Manejo de errores
- Estados de loading

### 4. Autenticación
- JWT tokens con refresh automático
- Estado global con Zustand
- Persistencia en localStorage
- Interceptores para requests

## 🛠️ Para el Desarrollador Backend

### Formato de Respuestas
\`\`\`typescript
// Respuesta exitosa
{
  "data": T,
  "message": "Success message",
  "success": true
}

// Respuesta con error
{
  "message": "Error message",
  "success": false,
  "code": "ERROR_CODE"
}
\`\`\`

### Autenticación
- Header: `Authorization: Bearer <token>`
- Refresh endpoint para renovar tokens
- Logout para invalidar tokens

### Validaciones
- El frontend valida con Zod
- El backend debe validar nuevamente
- Retornar errores 400 con mensajes claros

## 🎯 Características Implementadas

- ✅ Autenticación completa (login/register/logout)
- ✅ Gestión de perfil de usuario
- ✅ Exploración de laboratorios
- ✅ Sistema de reservas
- ✅ Gestión de reservas (ver/editar/cancelar)
- ✅ Verificación de disponibilidad en tiempo real
- ✅ UI responsive y profesional
- ✅ Manejo de errores robusto
- ✅ Cache inteligente de datos

## 🔄 Estado de Desarrollo

**Frontend**: ✅ Completo y listo para producción
**Backend**: ⏳ Pendiente de implementación

El sistema frontend está completamente funcional y listo para conectarse con cualquier backend que implemente los endpoints especificados.
