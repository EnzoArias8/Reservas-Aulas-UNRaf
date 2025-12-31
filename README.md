# 🎓 Sistema de Gestión de Reservas de Aulas - UNRaf

Este proyecto es una plataforma Full-Stack diseñada para centralizar y optimizar la reserva de aulas y laboratorios en las cuatro sedes de la Universidad Nacional de Rafaela (UNRaf). Permite a los docentes e investigadores gestionar espacios físicos de manera eficiente, evitando solapamientos de horarios y respetando el calendario académico de la institución.

## 🚀 Tecnologías Utilizadas

### 🖥️ Frontend
- Next.js 14 (App Router)
- React
- TanStack Query (Gestión de estado y caché)
- Tailwind CSS + Shadcn/ui (Diseño de interfaz)

### ⚙️ Backend
- Node.js + Express
- TypeScript (Tipado estático para mayor robustez)
- MongoDB + Mongoose (Base de datos NoSQL)
- JSON Web Tokens (JWT) (Autenticación segura)
- Bcryptjs (Cifrado de contraseñas)

### 🐳 Infraestructura
- Docker (Contenerización de la base de datos)

## 🛠️ Configuración y Ejecución

Para correr este proyecto localmente, seguí estos pasos:

### 1️⃣ Requisitos Previos
- Tener instalado Node.js (v18 o superior).
- Tener instalado Docker Desktop.

### 2️⃣ Clonar el repositorio
```bash
git clone https://github.com/EnzoArias8/Reservas-Aulas-UNRaf.git
cd reservas-aulas-unraf
```

### 3️⃣ Levantar la Base de Datos (Docker)
Entrá a la carpeta del backend y ejecutá:

```bash
cd backend
docker-compose up -d
```
La base de datos MongoDB estará disponible y podrás gestionarla visualmente en el puerto 8081.

### 4️⃣ Iniciar el Backend
Dentro de la carpeta backend:

```bash
npm install
npm run dev
```

El servidor correrá en: http://localhost:3001

### 5️⃣ Iniciar el Frontend
En una nueva terminal, entrá a la carpeta frontend:

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en: http://localhost:3000