import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

// ============================================
// SEMESTERS
// ============================================

export const getSemesters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { year: 'desc' }
    });
    
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
      await prisma.semester.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const semester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year,
        isActive
      }
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

    const semester = await prisma.semester.findUnique({
      where: { id }
    });

    if (!semester) {
      throw new AppError('Cuatrimestre no encontrado', 404);
    }

    await prisma.semester.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Cuatrimestre eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

export const updateSemester = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, year, isActive } = req.body;

    // Si se está marcando como activo, desactivar otros cuatrimestres
    if (isActive) {
      await prisma.semester.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(year !== undefined && { year }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.status(200).json({
      success: true,
      data: semester
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
    const examWeeks = await prisma.examWeek.findMany({
      include: {
        semesterObj: {
          select: {
            id: true,
            name: true,
            year: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    
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

    // Validar que el cuatrimestre existe
    const semesterData = await prisma.semester.findUnique({
      where: { id: semester }
    });

    if (!semesterData) {
      throw new AppError('Cuatrimestre no encontrado', 404);
    }

    const examWeek = await prisma.examWeek.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        semester
      },
      include: {
        semesterObj: {
          select: {
            id: true,
            name: true,
            year: true
          }
        }
      }
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

    const examWeek = await prisma.examWeek.findUnique({
      where: { id }
    });

    if (!examWeek) {
      throw new AppError('Semana de examen no encontrada', 404);
    }

    await prisma.examWeek.delete({
      where: { id }
    });

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
    const { year } = req.query;
    
    let filter: any = {};
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      filter.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const holidays = await prisma.holiday.findMany({
      where: filter,
      orderBy: { date: 'asc' }
    });
    
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

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        type,
        description
      }
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

    const holiday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!holiday) {
      throw new AppError('Feriado no encontrado', 404);
    }

    await prisma.holiday.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Feriado eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, date, type, description } = req.body;

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description })
      }
    });

    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    next(error);
  }
};
