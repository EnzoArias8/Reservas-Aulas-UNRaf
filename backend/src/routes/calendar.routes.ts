import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getSemesters,
  createSemester,
  deleteSemester,
  getExamWeeks,
  createExamWeek,
  deleteExamWeek,
  getHolidays,
  createHoliday,
  deleteHoliday
} from '../controllers/calendar.controller';

const router = Router();

// Rutas públicas de lectura (GET) - sin autenticación requerida
router.get('/semesters', getSemesters);
router.get('/exam-weeks', getExamWeeks);
router.get('/holidays', getHolidays);

// Rutas de escritura (POST/DELETE) - requieren autenticación y rol de Admin
router.post('/semesters', protect, authorize('Admin'), createSemester);
router.delete('/semesters/:id', protect, authorize('Admin'), deleteSemester);
router.post('/exam-weeks', protect, authorize('Admin'), createExamWeek);
router.delete('/exam-weeks/:id', protect, authorize('Admin'), deleteExamWeek);
router.post('/holidays', protect, authorize('Admin'), createHoliday);
router.delete('/holidays/:id', protect, authorize('Admin'), deleteHoliday);

export default router;




