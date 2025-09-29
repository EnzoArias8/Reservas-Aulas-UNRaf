import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import labRoutes from './routes/labRoutes.js';

dotenv.config();
const app = express();

// Agregar o asegurar CORS con credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json());

// Rutas existentes
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservationRoutes)
app.use('/api/reservations', reservationRoutes) // <-- alias agregado
app.use('/api/labs', labRoutes);

///app.listen(3001, () => {
///  console.log("Servidor corriendo en http://localhost:3001");
///});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT || 3001}`);
});

export default app;

