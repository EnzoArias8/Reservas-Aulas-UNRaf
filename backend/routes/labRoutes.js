import express from 'express';
import { listarLaboratorios } from '../controllers/labController.js';

const router = express.Router();

router.get('/', listarLaboratorios);

export default router;
