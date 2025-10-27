import { Request, Response, NextFunction } from 'express';
import { Semester } from '../models/Semester.model';
import { ExamWeek } from '../models/ExamWeek.model';
import { Holiday } from '../models/Holiday.model';
import { AppError } from '../utils/AppError';

// ============================================
// SEMESTERS
// ============================================

export const getSemesters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const semesters = await Semester.find().sort({ year: -1, startDate: -1 });
    
    res.status(200).json({
      success: true,
      data: semesters
    });
  } catch (error) {
    next(error);
  }
};

export const createSemester = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, startDate, endDate, year, isActive } = req.body;

    // Si se está marcando como activo, desactivar otros cuatrimestres
    if (isActive) {
      await Semester.updateMany({}, { isActive: false });
    }

    const semester = await Semester.create({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      year,
      isActive
    });

    res.status(201).json({
      success: true,
      data: semester
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSemester = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const semester = await Semester.findByIdAndDelete(id);
    
    if (!semester) {
      throw new AppError('Cuatrimestre no encontrado', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Cuatrimestre eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// EXAM WEEKS
// ============================================

export const getExamWeeks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const examWeeks = await ExamWeek.find().populate('semester', 'name year').sort({ startDate: -1 });
    
    res.status(200).json({
      success: true,
      data: examWeeks
    });
  } catch (error) {
    next(error);
  }
};

export const createExamWeek = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, startDate, endDate, semester } = req.body;

    const examWeek = await ExamWeek.create({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      semester
    });

    res.status(201).json({
      success: true,
      data: examWeek
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExamWeek = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const examWeek = await ExamWeek.findByIdAndDelete(id);
    
    if (!examWeek) {
      throw new AppError('Semana de examen no encontrada', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Semana de examen eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// HOLIDAYS
// ============================================

export const getHolidays = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: holidays
    });
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, date, type, description } = req.body;

    const holiday = await Holiday.create({
      name,
      date: new Date(date),
      type,
      description
    });

    res.status(201).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const holiday = await Holiday.findByIdAndDelete(id);
    
    if (!holiday) {
      throw new AppError('Feriado no encontrado', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Feriado eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};




