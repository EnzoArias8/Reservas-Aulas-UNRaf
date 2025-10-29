import { Router } from 'express';
import { createReservation, getReservations, getMyReservations, cancelReservation, getReservationById, updateReservation, getAvailableTimeSlotsForLab, deleteReservation } from '../controllers/reservation.controller';
import { getMyRecurringReservations, createRecurringReservation, deleteRecurringReservation, toggleRecurringReservation } from '../controllers/recurring-reservation.controller';
import { authorize, protect } from '../middleware/auth.middleware';

const router = Router();

// Ruta para crear una nueva reserva (accesible para estudiantes, profesores, investigadores y admin)
// Asegúrate de tener un middleware que adjunte el objeto de usuario a `req.user` antes de este middleware.
router.post('/', protect, authorize('Profesor', 'Investigador', 'Admin'), createReservation);
router.get('/', protect, authorize('Admin'), getReservations);
router.get('/me', protect, getMyReservations);
router.get('/available-slots', protect, getAvailableTimeSlotsForLab);

// Rutas de reservas recurrentes - deben ir ANTES de la ruta dinámica :id
router.get('/recurring', protect, getMyRecurringReservations);
router.post('/recurring', protect, authorize('Profesor'), createRecurringReservation);
router.delete('/recurring/:id', protect, authorize('Profesor'), deleteRecurringReservation);
router.put('/recurring/:id/toggle', protect, authorize('Profesor'), toggleRecurringReservation);

// Rutas dinámicas deben ir al final
router.get('/:id', protect, getReservationById);
router.put('/:id', protect, updateReservation);
router.put('/:id/cancel', protect, authorize('Admin'), cancelReservation);
router.delete('/:id', protect, authorize('Admin'), deleteReservation);

// Puedes añadir más rutas y protegerlas según el rol, por ejemplo:
// router.patch('/reservations/:id', restrictTo('Admin'), updateReservationStatus);

export default router;