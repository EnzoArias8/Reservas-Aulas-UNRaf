import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

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

// Función para crear una nueva reserva
export const createReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { labId, date, timeSlot, purpose, attendees } = req.body;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // 1. Validación de fecha: Evita reservas en el pasado
    const reservationDate = new Date(date);
    // Normalizar ambas fechas a medianoche para comparar solo el día
    reservationDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return next(new AppError('No se puede crear una reserva en una fecha pasada.', 400));
    }

    // 1.b Validación de feriados: No permitir reservas en feriados
    // Normalizar fecha a medianoche UTC para comparar solo el día
    const normalizedDate = new Date(reservationDate);
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
      return next(new AppError(`No se pueden hacer reservas en feriados. ${holiday.name}`, 400));
    }

    // 2. Validación de formato del timeSlot
    if (!timeSlot || !timeSlot.includes(' - ')) {
      return next(new AppError('Formato de horario inválido. Debe ser "HH:MM - HH:MM"', 400));
    }

    // 2. Validación de superposición de reservas
    // Parsear el timeSlot para obtener inicio y fin
    const [startTime, endTime] = timeSlot.split(' - ');
    if (!startTime || !endTime) {
      return next(new AppError('Formato de horario inválido. Debe ser "HH:MM - HH:MM"', 400));
    }
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Validar que las horas y minutos sean números válidos
    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      return next(new AppError('Formato de horario inválido. Las horas y minutos deben ser números válidos.', 400));
    }
    
    // Validar que la hora de fin sea posterior a la hora de inicio
    if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
      return next(new AppError('La hora de fin debe ser posterior a la hora de inicio.', 400));
    }
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Buscar reservas que se superpongan
    // Crear rango de búsqueda para el día completo (00:00:00 a 23:59:59)
    const searchDateStart = new Date(reservationDate);
    searchDateStart.setHours(0, 0, 0, 0);
    const searchDateEnd = new Date(reservationDate);
    searchDateEnd.setHours(23, 59, 59, 999);
    
    const existingReservations = await prisma.reservation.findMany({
      where: {
        labId,
        date: {
          gte: searchDateStart,
          lte: searchDateEnd
        },
        status: 'confirmed'
      }
    });

    // Verificar superposición con reservas existentes
    for (const existing of existingReservations) {
      const [existingStart, existingEnd] = existing.timeSlot.split(' - ');
      const [existingStartHour, existingStartMinute] = existingStart.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = existingEnd.split(':').map(Number);
      
      const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
      const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

      // Si hay superposición, rechazar la reserva
      if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
        return next(new AppError('El horario seleccionado ya está reservado. Por favor, elige otro horario.', 400));
      }
    }

    // 3. Validación de día de la semana y horarios especiales
    const dow = getDayOfWeekFromDateString(date);
    
    // No permitir reservas los domingos
    if (dow === 0) {
      return next(new AppError('No se permiten reservas los domingos.', 400));
    }

    // Sábados: solo entre 08:00 y 12:00
    if (dow === 6) {
      const min = 8 * 60; // 08:00
      const max = 12 * 60; // 12:00
      if (startMinutes < min || endMinutes > max) {
        return next(new AppError('Los sábados solo se permiten reservas entre 08:00 y 12:00.', 400));
      }
    }

    // 4. Validar capacidad del laboratorio
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });
    if (!lab) {
      return next(new AppError('Laboratorio no encontrado', 404));
    }
    if (attendees > lab.capacity) {
      return next(new AppError(`El número de asistentes excede la capacidad máxima del laboratorio (${lab.capacity}).`, 400));
    }

    // 5. Validar conflicto con reservas recurrentes
    // Solo aplicar si NO estamos en una semana de examen
    const normalizedRecDate = new Date(reservationDate);
    normalizedRecDate.setUTCHours(0, 0, 0, 0);
    const nextRecDay = new Date(normalizedRecDate);
    nextRecDay.setUTCDate(nextRecDay.getUTCDate() + 1);
    
    const isInExamWeek = await prisma.examWeek.findFirst({
      where: {
        startDate: { lte: nextRecDay },
        endDate: { gte: normalizedRecDate }
      }
    });

    if (!isInExamWeek) {
      // Buscar cuatrimestres activos que cubran esta fecha
      const activeSemesters = await prisma.semester.findMany({ 
        where: { isActive: true } 
      });
      const activeIds = activeSemesters
        .filter(s => {
          const d = new Date(reservationDate.toISOString().split('T')[0]);
          const start = new Date(new Date(s.startDate).toISOString().split('T')[0]);
          const end = new Date(new Date(s.endDate).toISOString().split('T')[0]);
          return d >= start && d <= end;
        })
        .map(s => s.id);

      if (activeIds.length > 0) {
        const conflictingRecurring = await prisma.recurringReservation.findMany({
          where: {
            labId,
            dayOfWeek: dow,
            semester: { in: activeIds },
            isActive: true
          }
        });

        for (const recurring of conflictingRecurring) {
          const [rStartH, rStartM] = recurring.startTime.split(':').map(Number);
          const [rEndH, rEndM] = recurring.endTime.split(':').map(Number);
          const recStart = rStartH * 60 + rStartM;
          const recEnd = rEndH * 60 + rEndM;
          
          if (startMinutes < recEnd && endMinutes > recStart) {
            return next(new AppError('Este horario entra en conflicto con una reserva recurrente existente.', 400));
          }
        }
      }
    }

    // 6. Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        labId,
        date: reservationDate,
        timeSlot,
        purpose,
        attendees
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        lab: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            capacity: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// Obtener reservas del usuario autenticado
export const getMyReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const { status, dateFrom, dateTo } = req.query as any;
    const filter: any = { userId };
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.gte = new Date(dateFrom);
      if (dateTo) filter.date.lte = new Date(dateTo);
    }

    const reservations = await prisma.reservation.findMany({
      where: filter,
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            capacity: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las reservas (para admin)
export const getReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, labId, dateFrom, dateTo, userId } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (labId) filter.labId = labId;
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.gte = new Date(dateFrom);
      if (dateTo) filter.date.lte = new Date(dateTo);
    }

    const reservations = await prisma.reservation.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        lab: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            capacity: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una reserva
export const updateReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { purpose, attendees } = req.body;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError('No tienes permisos para modificar esta reserva', 403);
    }

    // Validar capacidad si se actualiza el número de asistentes
    if (attendees !== undefined) {
      const lab = await prisma.lab.findUnique({
        where: { id: reservation.labId }
      });
      if (lab && attendees > lab.capacity) {
        throw new AppError(`El número de asistentes excede la capacidad máxima del laboratorio (${lab.capacity}).`, 400);
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(purpose !== undefined && { purpose }),
        ...(attendees !== undefined && { attendees })
      },
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            capacity: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      data: updatedReservation
    });
  } catch (error) {
    next(error);
  }
};

// Cancelar una reserva
export const cancelReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // Verificar que la reserva existe y pertenece al usuario
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError('No tienes permisos para cancelar esta reserva', 403);
    }

    // No permitir cancelar reservas del pasado
    const reservationDate = new Date(reservation.date);
    reservationDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new AppError('No se pueden cancelar reservas de fechas pasadas', 400);
    }

    await prisma.reservation.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener horarios disponibles para un laboratorio en una fecha específica
export const getAvailableTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { labId, date } = req.query;

    if (!labId || !date) {
      throw new AppError('El laboratorio y la fecha son requeridos', 400);
    }

    // Verificar que el laboratorio existe
    const lab = await prisma.lab.findUnique({
      where: { id: labId as string }
    });
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
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
        labId: labId as string,
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
          labId: labId as string, 
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
      // Verificar con recurrentes también
      for (const r of recurring) {
        const [existingStartTime, existingEndTime] = [r.startTime, r.endTime];
        const [existingStartHour, existingStartMinute] = existingStartTime.split(':').map(Number);
        const [existingEndHour, existingEndMinute] = existingEndTime.split(':').map(Number);
        const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
        const existingEndMinutes = existingEndHour * 60 + existingEndMinute;
        if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
          return false;
        }
      }
      return true;
    };

    // Filtrar solo los slots disponibles
    const availableSlots = allTimeSlots.filter(isSlotAvailable);

    res.status(200).json({
      success: true,
      data: {
        availableSlots,
        allSlots: allTimeSlots
      }
    });
  } catch (error) {
    next(error);
  }
};
