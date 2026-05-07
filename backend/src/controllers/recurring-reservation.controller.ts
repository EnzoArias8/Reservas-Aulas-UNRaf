import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

// ============================================
// RECURRING RESERVATIONS
// ============================================

// Obtener todas las reservas recurrentes del usuario autenticado
export const getMyRecurringReservations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const reservations = await prisma.recurringReservation.findMany({
      where: { userId },
      include: {
        lab: {
          select: {
            name: true,
            building: true,
            floor: true
          }
        },
        semesterObj: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

// Crear una nueva reserva recurrente
export const createRecurringReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const { labId, dayOfWeek, startTime, endTime, semester, purpose, attendees } = req.body;

    // Validaciones de día y horario para reservas recurrentes
    // - No permitir domingos (0)
    // - Sábados (6) solo entre 08:00 y 12:00
    // - La hora de fin debe ser posterior a la hora de inicio
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError('Día de la semana inválido', 400);
    }

    if (dayOfWeek === 0) {
      throw new AppError('No se permiten reservas recurrentes los domingos.', 400);
    }

    const parseTime = (t: string) => {
      const [h, m] = String(t).split(':').map(Number);
      return { h, m, total: h * 60 + m };
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (!Number.isFinite(start.total) || !Number.isFinite(end.total)) {
      throw new AppError('Horario inválido', 400);
    }

    if (end.total <= start.total) {
      throw new AppError('La hora de fin debe ser posterior a la hora de inicio.', 400);
    }

    if (dayOfWeek === 6) {
      const min = parseTime('08:00').total;
      const max = parseTime('12:00').total; // fin máximo permitido
      if (start.total < min || end.total > max) {
        throw new AppError('Los sábados solo se permiten reservas entre 08:00 y 12:00.', 400);
      }
    }

    // Validar que el cuatrimestre existe
    const semesterData = await prisma.semester.findUnique({
      where: { id: semester }
    });
    if (!semesterData) {
      throw new AppError('Cuatrimestre no encontrado', 404);
    }

    // Validar capacidad del aula
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }
    if (typeof attendees === 'number' && attendees > lab.capacity) {
      throw new AppError(`El número de asistentes excede la capacidad máxima del aula (${lab.capacity}).`, 400);
    }

    // Crear la reserva recurrente
    const reservation = await prisma.recurringReservation.create({
      data: {
        userId,
        labId,
        dayOfWeek,
        startTime,
        endTime,
        semester,
        purpose,
        attendees
      },
      include: {
        lab: {
          select: {
            name: true,
            building: true,
            floor: true
          }
        },
        semesterObj: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una reserva recurrente
export const deleteRecurringReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // Verificar que la reserva pertenece al usuario
    const reservation = await prisma.recurringReservation.findUnique({
      where: { id }
    });
    
    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError('No tienes permisos para eliminar esta reserva', 403);
    }

    await prisma.recurringReservation.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Reserva recurrente eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle activa/inactiva una reserva recurrente
export const toggleRecurringReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const reservation = await prisma.recurringReservation.findUnique({
      where: { id }
    });
    
    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError('No tienes permisos para modificar esta reserva', 403);
    }

    const updatedReservation = await prisma.recurringReservation.update({
      where: { id },
      data: { isActive: !reservation.isActive }
    });

    res.status(200).json({
      success: true,
      data: updatedReservation
    });
  } catch (error) {
    next(error);
  }
};
