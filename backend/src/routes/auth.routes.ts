// routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validaciones
const registerValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('faculty').optional().trim(),
  body('role').optional().isIn(['Estudiante', 'Profesor', 'Investigador']),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  validate
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  validate
];

// Rutas públicas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);

// Rutas protegidas
router.use(protect); // Todas las rutas siguientes requieren autenticación

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', updateProfile);
router.post('/change-password', changePasswordValidation, changePassword);

export default router;