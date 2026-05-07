import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllLabs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { building, capacity, isActive } = req.query;

    const filter: any = {};

    if (building) filter.building = building;
    if (capacity) filter.capacity = { gte: Number(capacity) };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const labs = await prisma.lab.findMany({
      where: filter,
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      success: true,
      message: 'Laboratorios obtenidos exitosamente',
      data: labs,
      count: labs.length
    });
  } catch (error) {
    next(error);
  }
};

export const getLabById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: req.params.id }
    });

    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Laboratorio obtenido exitosamente',
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

export const createLab = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lab = await prisma.lab.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Laboratorio creado exitosamente',
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

export const updateLab = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lab = await prisma.lab.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Laboratorio actualizado exitosamente',
      data: lab
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLab = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { id: req.params.id }
    });

    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    // Verificar si hay reservas activas
    const activeReservations = await prisma.reservation.count({
      where: {
        labId: req.params.id,
        date: { gte: new Date() },
        status: { in: ['confirmed'] }
      }
    });

    if (activeReservations > 0) {
      throw new AppError(
        'No se puede eliminar el laboratorio porque tiene reservas activas',
        400
      );
    }

    await prisma.lab.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Laboratorio eliminado exitosamente',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableTimeSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      throw new AppError('La fecha es requerida', 400);
    }

    // Verificar que el laboratorio existe
    const lab = await prisma.lab.findUnique({
      where: { id }
    });
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    // Normalizar fecha para comparaciones
    // Función auxiliar para parsear fecha string y obtener el día de la semana
    // Evita problemas de zona horaria parseando manualmente la fecha
    function getDayOfWeekFromDateString(dateString: string): number {
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) {
        throw new Error('Formato de fecha inválido. Debe ser YYYY-MM-DD');
      }
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Los meses en JavaScript son 0-indexados
      const day = parseInt(dateParts[2], 10);
      
      // Crear una fecha en la zona horaria local para obtener el día correcto
      const date = new Date(year, month, day);
      return date.getDay();
    }
    
    const dt = new Date(String(date));
    let dow: number;
    try {
      dow = getDayOfWeekFromDateString(String(date));
    } catch (error: any) {
      throw new AppError(error.message || 'Formato de fecha inválido', 400);
    }

    // Domingos: no hay horarios disponibles
    if (dow === 0) {
      res.status(200).json({ 
        success: true, 
        data: { availableSlots: [], allSlots: [] } 
      });
      return;
    }

    // Verificar si es feriado: no hay horarios disponibles
    const normalizedDate = new Date(dt);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(normalizedDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    
    const holiday = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: normalizedDate,
          lt: nextDay
        }
      }
    });
    
    if (holiday) {
      res.status(200).json({ 
        success: true, 
        data: { availableSlots: [], allSlots: [] } 
      });
      return;
    }

    // Generar horarios posibles según el día de la semana
    const allTimeSlots = [];
    const startHour = 8;
    const endHourExclusive = dow === 6 ? 12 : 23; // Sábado hasta 12:00, otros días hasta 23:00

    for (let hour = startHour; hour < endHourExclusive; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 45 ? hour + 1 : hour;
        const endMinute = minute === 45 ? 0 : minute + 15;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        // En sábado, asegurarse de que el fin no exceda 12:00
        if (dow === 6 && (endHour > 12 || (endHour === 12 && endMinute > 0))) {
          continue;
        }

        allTimeSlots.push(`${startTime} - ${endTime}`);
      }
    }

    // Obtener reservas existentes para este laboratorio en esta fecha
    const existingReservations = await prisma.reservation.findMany({
      where: {
        labId: id,
        date: new Date(String(date)),
        status: 'confirmed'
      }
    });

    // Obtener reservas recurrentes que apliquen para este día
    // IMPORTANTE: Las reservas recurrentes NO se aplican durante semanas de examen
    const normalizedRecDate = new Date(dt);
    normalizedRecDate.setUTCHours(0, 0, 0, 0);
    const nextRecDay = new Date(normalizedRecDate);
    nextRecDay.setUTCDate(nextRecDay.getUTCDate() + 1);
    
    const isInExamWeek = await prisma.examWeek.findFirst({
      where: {
        startDate: { lte: nextRecDay },
        endDate: { gte: normalizedRecDate }
      }
    });

    let recurring: any[] = [];
    // Solo obtener reservas recurrentes si NO estamos en una semana de examen
    if (!isInExamWeek) {
      const active = await prisma.semester.findMany({ where: { isActive: true } });
      const activeIds = active
        .filter(s => {
          const d = new Date(dt.toISOString().split('T')[0]);
          const start = new Date(new Date(s.startDate).toISOString().split('T')[0]);
          const end = new Date(new Date(s.endDate).toISOString().split('T')[0]);
          return d >= start && d <= end;
        })
        .map(s => s.id);
      recurring = await prisma.recurringReservation.findMany({ 
        where: { 
          labId: id, 
          dayOfWeek: dow, 
          semester: { in: activeIds }, 
          isActive: true 
        } 
      });
    }

    // Función para verificar si un slot está disponible
    const isSlotAvailable = (timeSlot: string) => {
      const [startTime, endTime] = timeSlot.split(' - ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Verificar si se superpone con alguna reserva existente
      for (const reservation of existingReservations) {
        const [existingStartTime, existingEndTime] = reservation.timeSlot.split(' - ');
        const [existingStartHour, existingStartMinute] = existingStartTime.split(':').map(Number);
        const [existingEndHour, existingEndMinute] = existingEndTime.split(':').map(Number);
        
        const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
        const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

        // Si hay superposición, el slot no está disponible
        if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
          return false;
        }
      }
      
      // Verificar con reservas recurrentes también
      for (const r of recurring) {
        const [rStartH, rStartM] = r.startTime.split(':').map(Number);
        const [rEndH, rEndM] = r.endTime.split(':').map(Number);
        const recStart = rStartH * 60 + rStartM;
        const recEnd = rEndH * 60 + rEndM;
        if (startMinutes < recEnd && endMinutes > recStart) {
          return false;
        }
      }
      
      return true;
    };

    // Filtrar horarios disponibles
    const availableSlots = allTimeSlots.filter(isSlotAvailable);

    res.status(200).json({
      success: true,
      message: 'Horarios disponibles obtenidos exitosamente',
      data: {
        availableSlots,
        allSlots: allTimeSlots
      }
    });
  } catch (error) {
    next(error);
  }
};
