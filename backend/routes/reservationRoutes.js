import express from 'express';
import { crearReserva, obtenerMisReservas, cancelarReserva } from '../controllers/reservationController.js';
import { autenticar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(autenticar);
router.get('/', obtenerMisReservas);
router.post('/', crearReserva);
router.delete('/:id', cancelarReserva);

export default router;