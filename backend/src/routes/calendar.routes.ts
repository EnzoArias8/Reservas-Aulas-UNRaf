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

// Todas las rutas requieren autenticación y rol de Admin
router.use(protect, authorize('Admin'));

// Rutas de cuatrimestres
router.get('/semesters', getSemesters);
router.post('/semesters', createSemester);
router.delete('/semesters/:id', deleteSemester);

// Rutas de semanas de examen
router.get('/exam-weeks', getExamWeeks);
router.post('/exam-weeks', createExamWeek);
router.delete('/exam-weeks/:id', deleteExamWeek);

// Rutas de feriados
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);
router.delete('/holidays/:id', deleteHoliday);

export default router;




