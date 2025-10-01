// routes/reservation.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  deleteReservation,
  getUserReservations,
  getMyReservations
} from '../controllers/reservation.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validaciones
const reservationValidation = [
  body('labId').notEmpty().withMessage('El laboratorio es requerido'),
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('timeSlot').notEmpty().withMessage('El horario es requerido'),
  body('purpose').trim().notEmpty().withMessage('El propósito es requerido'),
  body('attendees').isInt({ min: 1 }).withMessage('El número de asistentes debe ser al menos 1'),
  validate
];

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de usuario
router.get('/me', getMyReservations);
router.post('/', reservationValidation, createReservation);
router.get('/:id', getReservationById);
router.put('/:id', updateReservation);
router.put('/:id/cancel', cancelReservation);
router.delete('/:id', deleteReservation);

// Rutas administrativas
router.get('/', authorize('Admin', 'Profesor'), getAllReservations);
router.get('/user/:userId', authorize('Admin', 'Profesor'), getUserReservations);

export default router;