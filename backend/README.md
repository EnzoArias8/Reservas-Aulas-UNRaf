# 🔬 Sistema de Reservas de Laboratorios - Backend

Backend completo desarrollado con Node.js, Express, TypeScript y MongoDB para el sistema de reservas de laboratorios universitarios.

## 📋 Características

- ✅ Autenticación JWT con refresh tokens
- ✅ CRUD completo de usuarios, laboratorios y reservas
- ✅ Sistema de roles (Admin, Profesor, Estudiante, Investigador)
- ✅ Validación de disponibilidad de horarios
- ✅ Límites de capacidad y reservas por usuario
- ✅ Manejo de errores centralizado
- ✅ Validación de datos con express-validator
- ✅ Seguridad con helmet y CORS
- ✅ TypeScript para type safety

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- MongoDB 6+ (local o MongoDB Atlas)
- npm o yarn

### Paso 1: Clonar e instalar dependencias

```bash
# Navegar a la carpeta del backend
cd backend

# Instalar dependencias
npm install
```

### Paso 2: Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/lab_reservations

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_cambiar_tambien
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Cookies
COOKIE_EXPIRE=7
```

### Paso 3: Iniciar MongoDB

Si usas MongoDB local:
```bash
mongod
```

Si usas MongoDB Atlas, asegúrate de tener tu connection string en `MONGODB_URI`.

### Paso 4: Poblar la base de datos (opcional pero recomendado)

```bash
npm run seed
```

Este comando creará usuarios, laboratorios y reservas de ejemplo.

### Paso 5: Iniciar el servidor

**Modo desarrollo (con hot reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm run build
npm start
```

El servidor estará disponible en: `http://localhost:3001`

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración de MongoDB
│   ├── controllers/
│   │   ├── auth.controller.ts   # Controladores de autenticación
│   │   ├── lab.controller.ts    # Controladores de laboratorios
│   │   └── reservation.controller.ts # Controladores de reservas
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Middleware de autenticación
│   │   ├── error.middleware.ts  # Manejo de errores
│   │   └── validation.middleware.ts # Validación de datos
│   ├── models/
│   │   ├── User.model.ts        # Modelo de usuario
│   │   ├── Lab.model.ts         # Modelo de laboratorio
│   │   └── Reservation.model.ts # Modelo de reserva
│   ├── routes/
│   │   ├── auth.routes.ts       # Rutas de autenticación
│   │   ├── lab.routes.ts        # Rutas de laboratorios
│   │   └── reservation.routes.ts # Rutas de reservas
│   ├── scripts/
│   │   └── seed.ts              # Script para poblar BD
│   ├── utils/
│   │   ├── AppError.ts          # Clase de errores personalizados
│   │   └── jwt.utils.ts         # Utilidades JWT
│   └── server.ts                # Punto de entrada
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |
| GET | `/api/auth/me` | Obtener perfil actual | Sí |
| PUT | `/api/auth/profile` | Actualizar perfil | Sí |
| POST | `/api/auth/change-password` | Cambiar contraseña | Sí |
| POST | `/api/auth/refresh` | Renovar access token | No |

### Laboratorios

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/labs` | Listar laboratorios | No | - |
| GET | `/api/labs/:id` | Obtener laboratorio | No | - |
| GET | `/api/labs/:id/available-slots` | Horarios disponibles | No | - |
| POST | `/api/labs` | Crear laboratorio | Sí | Admin/Profesor |
| PUT | `/api/labs/:id` | Actualizar laboratorio | Sí | Admin/Profesor |
| DELETE | `/api/labs/:id` | Eliminar laboratorio | Sí | Admin |

### Reservas

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| POST | `/api/reservations` | Crear reserva | Sí | Todos |
| GET | `/api/reservations/me` | Mis reservas | Sí | Todos |
| GET | `/api/reservations` | Todas las reservas | Sí | Admin/Profesor |
| GET | `/api/reservations/:id` | Detalle de reserva | Sí | Owner/Admin/Profesor |
| PUT | `/api/reservations/:id` | Actualizar reserva | Sí | Owner/Admin/Profesor |
| PUT | `/api/reservations/:id/cancel` | Cancelar reserva | Sí | Owner/Admin/Profesor |
| DELETE | `/api/reservations/:id` | Eliminar reserva | Sí | Admin |
| GET | `/api/reservations/user/:userId` | Reservas de usuario | Sí | Admin/Profesor |

## 📝 Ejemplos de Uso

### Registro de Usuario

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Usuario",
    "email": "test@unraf.edu.ar",
    "password": "password123",
    "faculty": "Ingeniería",
    "role": "Estudiante"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@unraf.edu.ar",
    "password": "password123"
  }'
```

### Crear Reserva

```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "labId": "LABORATORY_ID",
    "date": "2025-10-15",
    "timeSlot": "10:00 - 12:00",
    "purpose": "Práctica de laboratorio",
    "attendees": 15
  }'
```

### Obtener Mis Reservas

```bash
curl -X GET http://localhost:3001/api/reservations/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔐 Sistema de Autenticación

El sistema utiliza JWT (JSON Web Tokens) con dos tipos de tokens:

- **Access Token**: Válido por 15 minutos, usado para autenticar requests
- **Refresh Token**: Válido por 7 días, usado para renovar el access token

Los tokens se envían en:
1. Header `Authorization: Bearer {token}`
2. Cookies HTTP-only (más seguro para web)

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Tokens JWT firmados y verificados
- Validación de datos en todas las rutas
- CORS configurado
- Helmet para headers de seguridad
- Rate limiting (implementable)
- Sanitización de inputs

## 🧪 Testing

```bash
npm test
```

## 📦 Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 🐛 Debugging

Para ver logs detallados en desarrollo, el servidor usa `morgan` en modo 'dev'.

## 📊 Base de Datos

### Colecciones

- **users**: Usuarios del sistema
- **labs**: Laboratorios disponibles
- **reservations**: Reservas realizadas

### Índices

Índices automáticos creados para optimizar consultas:
- Email único en usuarios
- Fecha y horario en reservas
- Búsquedas por laboratorio y fecha

## 🚨 Manejo de Errores

Todos los errores son manejados centralizadamente y devuelven:

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## 🔄 Actualizar Frontend

Asegúrate de que tu frontend apunte a la URL correcta del backend:

En `frontend/lib/api.ts`:
```typescript
const API_BASE_URL = "http://localhost:3001/api"
```

## 📞 Soporte

Para problemas o consultas, revisa los logs del servidor o contacta al equipo de desarrollo.

## 📄 Licencia

MIT