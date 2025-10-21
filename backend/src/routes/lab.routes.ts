// routes/lab.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllLabs,
  getLabById,
  createLab,
  updateLab,
  deleteLab,
  getAvailableTimeSlots
} from '../controllers/lab.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validaciones
const labValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('building').trim().notEmpty().withMessage('El edificio es requerido'),
  body('floor').trim().notEmpty().withMessage('El piso es requerido'),
  body('capacity').isInt({ min: 1 }).withMessage('La capacidad debe ser al menos 1'),
  body('equipment').optional().isArray().withMessage('El equipamiento debe ser un array'),
  validate
];

// Rutas públicas (o protegidas según tu necesidad)
router.get('/', getAllLabs);
router.get('/:id', getLabById);
router.get('/:id/available-slots', getAvailableTimeSlots);

// Rutas protegidas solo para admin
router.use(protect);
router.post('/', authorize('Admin'), labValidation, createLab);
router.put('/:id', authorize('Admin'), updateLab);
router.delete('/:id', authorize('Admin'), deleteLab);

export default router;