import { Router } from 'express';
import { createReservation } from '../controllers/reservation.controller';
import { authorize, protect } from '../middleware/auth.middleware'; // Importar el middleware

const router = Router();

// Ruta para crear una nueva reserva (accesible para estudiantes, profesores e investigadores)
// Asegúrate de tener un middleware que adjunte el objeto de usuario a `req.user` antes de este middleware.
router.post('/', protect, authorize('Estudiante', 'Profesor', 'Investigador'), createReservation);

// Puedes añadir más rutas y protegerlas según el rol, por ejemplo:
// router.patch('/reservations/:id', restrictTo('Admin'), updateReservationStatus);

export default router;