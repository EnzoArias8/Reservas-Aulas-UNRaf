# Workspace de Reservas de Aulas UNRaf

Este archivo `package.json` raíz actúa como orquestador para el desarrollo local del proyecto full-stack.

## Scripts Disponibles

### Instalación
```bash
npm run install:all
```
Instala todas las dependencias del proyecto:
- Dependencias del workspace (concurrently)
- Dependencias del frontend (con --legacy-peer-deps para resolver conflictos)
- Dependencias del backend

### Desarrollo Local
```bash
npm run dev
```
Inicia simultáneamente:
- Servidor de desarrollo del backend (http://localhost:8000)
- Servidor de desarrollo del frontend (http://localhost:3000)

### Build para Producción
```bash
npm run build
```
Compila ambos proyectos secuencialmente:
1. Build del backend (TypeScript a JavaScript)
2. Build del frontend (Next.js a archivos estáticos)

### Servidores de Producción
```bash
npm run start
```
Inicia ambos servidores en modo producción:
- Backend: archivos compilados en `/backend/dist`
- Frontend: servidor Next.js en modo producción

## Scripts Individuales

También puedes ejecutar cada proyecto por separado:

```bash
# Frontend
npm run dev:frontend
npm run build:frontend
npm run start:frontend

# Backend
npm run dev:backend
npm run build:backend
npm run start:backend
```

## Flujo de Trabajo Recomendado

1. **Primera vez**: `npm run install:all`
2. **Desarrollo diario**: `npm run dev`
3. **Antes de deploy**: `npm run build`
4. **Testing en producción**: `npm run start`

## Notas

- El workspace no modifica el código interno del frontend ni backend
- El archivo `vercel.json` existente sigue funcionando para despliegue
- Se usa `--legacy-peer-deps` para resolver conflictos de dependencias del frontend
- `concurrently` permite ejecutar múltiples comandos en la misma terminal
