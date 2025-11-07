import { Request, Response, NextFunction } from 'express';
import { Reservation, IReservation } from '../models/Reservation.model';
import { Lab, ILab } from '../models/Lab.model';
import { RecurringReservation } from '../models/RecurringReservation.model';
import { Semester } from '../models/Semester.model';
import { Holiday } from '../models/Holiday.model';
import { ExamWeek } from '../models/ExamWeek.model';
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
    const { labId, date, timeSlot, purpose, attendees } = req.body;

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
    
    const holiday = await Holiday.findOne({
      date: {
        $gte: normalizedDate,
        $lt: nextDay
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
    
    const existingReservations = await Reservation.find({
      labId,
      date: {
        $gte: searchDateStart,
        $lte: searchDateEnd
      },
      status: { $in: ['confirmed'] }
    });

    for (const reservation of existingReservations) {
      const [existingStart, existingEnd] = reservation.timeSlot.split(' - ');
      const [existingStartHour, existingStartMinute] = existingStart.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = existingEnd.split(':').map(Number);
      
      const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
      const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

      // Verificar superposición: dos rangos se superponen si NO están completamente separados
      // Se superponen si: startMinutes < existingEndMinutes && endMinutes > existingStartMinutes
      if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
        return next(new AppError(
          `Este laboratorio ya está reservado en un horario que se superpone: ${reservation.timeSlot}. Por favor, selecciona otro horario que no se superponga.`, 
          409
        ));
      }
    }

    // 2.b Validar superposición con reservas recurrentes activas
    // IMPORTANTE: Las reservas recurrentes NO se aplican durante semanas de examen
    // Obtener el día de la semana de manera segura para evitar problemas de zona horaria
    let dayOfWeek: number;
    try {
      dayOfWeek = getDayOfWeekFromDateString(date);
    } catch (error: any) {
      return next(new AppError(error.message || 'Formato de fecha inválido', 400));
    }
    
    const targetDate = new Date(reservationDate);
    
    // Verificar si la fecha está en una semana de examen
    // Normalizar fecha a medianoche UTC para comparar solo el día
    const normalizedExamDate = new Date(targetDate);
    normalizedExamDate.setUTCHours(0, 0, 0, 0);
    const nextExamDay = new Date(normalizedExamDate);
    nextExamDay.setUTCDate(nextExamDay.getUTCDate() + 1);
    
    const isInExamWeek = await ExamWeek.findOne({
      startDate: { $lte: nextExamDay },
      endDate: { $gte: normalizedExamDate }
    });

    // Solo verificar reservas recurrentes si NO estamos en una semana de examen
    if (!isInExamWeek) {
      // Parsear la fecha string para comparar con los semestres
      const dateParts = date.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const targetDateLocal = new Date(year, month, day);
      
      const activeSemesters = await Semester.find({ isActive: true });
      const activeSemesterIds = activeSemesters
        .filter(s => {
          // Normalizar fechas del semestre a medianoche local para comparar
          const semesterStart = new Date(s.startDate);
          semesterStart.setHours(0, 0, 0, 0);
          const semesterEnd = new Date(s.endDate);
          semesterEnd.setHours(0, 0, 0, 0);
          
          return targetDateLocal >= semesterStart && targetDateLocal <= semesterEnd;
        })
        .map(s => s._id);

      if (activeSemesterIds.length > 0) {
        const recs = await RecurringReservation.find({ 
          labId, 
          dayOfWeek, 
          semester: { $in: activeSemesterIds }, 
          isActive: true 
        });
        
        for (const r of recs) {
          const [rStartH, rStartM] = r.startTime.split(':').map(Number);
          const [rEndH, rEndM] = r.endTime.split(':').map(Number);
          const recStart = rStartH * 60 + rStartM;
          const recEnd = rEndH * 60 + rEndM;
          
          // Verificar superposición: dos rangos se superponen si se cruzan
          // Se superponen si: startMinutes < recEnd && endMinutes > recStart
          if (startMinutes < recEnd && endMinutes > recStart) {
            return next(new AppError(
              `Este horario se superpone con una reserva recurrente activa (${r.startTime} - ${r.endTime}).`, 
              409
            ));
          }
        }
      }
    }

    // 3. Validación de capacidad
    const lab: ILab | null = await Lab.findById(labId);
    if (!lab) {
      return next(new AppError('Laboratorio no encontrado.', 404));
    }

    if (attendees > lab.capacity) {
      return next(new AppError(`El número de asistentes excede la capacidad máxima del laboratorio (${lab.capacity}).`, 400));
    }

    // Crear la reserva confirmada automáticamente
    const newReservation = new Reservation({
      userId: req.user?.id,
      labId,
      date: reservationDate,
      timeSlot,
      purpose,
      attendees,
      status: 'confirmed' // Estado inicial de la reserva (confirmada automáticamente)
    });

    await newReservation.save();

    // Poblar el lab antes de devolver la respuesta
    await newReservation.populate('labId', 'name building floor capacity equipment');
    await newReservation.populate('userId', 'email nombre apellido');

    res.status(201).json({
      success: true,
      data: newReservation
    });
  } catch (error) {
    next(error);
  }
};

// Función para obtener una reserva específica por ID
export const getReservationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log("🔍 Backend: Getting reservation by ID:", id, "for user:", userId);

    const reservation = await Reservation.findById(id)
      .populate('labId', 'name building floor capacity equipment')
      .populate('userId', 'email');

    if (!reservation) {
      return next(new AppError('Reserva no encontrada', 404));
    }

    // Verificar que el usuario sea el propietario de la reserva o un admin
    if (reservation.userId.toString() !== userId && req.user?.role !== 'Admin') {
      return next(new AppError('No tienes permisos para acceder a esta reserva', 403));
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// Función para actualizar una reserva
export const updateReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, timeSlot, purpose, attendees, status } = req.body;
    const userId = req.user?.id;

    console.log("🔧 Backend: Updating reservation:", id, "with data:", req.body);

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return next(new AppError('Reserva no encontrada', 404));
    }

    // Verificar que el usuario sea el propietario de la reserva o un admin
    if (reservation.userId.toString() !== userId && req.user?.role !== 'Admin') {
      return next(new AppError('No tienes permisos para editar esta reserva', 403));
    }

    // Validar si se está cambiando la fecha
    const isDateChanging = date && new Date(date).toISOString().split('T')[0] !== new Date(reservation.date).toISOString().split('T')[0];
    const isTimeSlotChanging = timeSlot && timeSlot !== reservation.timeSlot;

    if (isDateChanging) {
      // Validar fecha pasada
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        return next(new AppError('No se puede cambiar una reserva a una fecha pasada.', 400));
      }

      // Validar feriados
      const normalizedDate = new Date(newDate);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      
      const holiday = await Holiday.findOne({
        date: {
          $gte: normalizedDate,
          $lt: nextDay
        }
      });
      
      if (holiday) {
        return next(new AppError(`No se pueden hacer reservas en feriados. ${holiday.name}`, 400));
      }
    }

    // Si se está cambiando la fecha o el horario, validar conflictos
    if (isDateChanging || isTimeSlotChanging) {
      const newDate = date ? new Date(date) : reservation.date;
      const newTimeSlot = timeSlot || reservation.timeSlot;
      const labId = reservation.labId;

      // Validar formato del timeSlot
      if (!newTimeSlot || !newTimeSlot.includes(' - ')) {
        return next(new AppError('Formato de horario inválido. Debe ser "HH:MM - HH:MM"', 400));
      }

      // Parsear el nuevo timeSlot para obtener inicio y fin
      const [startTime, endTime] = newTimeSlot.split(' - ');
      if (!startTime || !endTime) {
        return next(new AppError('Formato de horario inválido. Debe ser "HH:MM - HH:MM"', 400));
      }
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Validar que las horas y minutos sean números válidos
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        return next(new AppError('Formato de horario inválido. Las horas y minutos deben ser números válidos.', 400));
      }
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Validar que la hora de fin sea posterior a la hora de inicio
      if (startMinutes >= endMinutes) {
        return next(new AppError('La hora de fin debe ser posterior a la hora de inicio.', 400));
      }

      // Normalizar fecha para búsqueda
      const searchDateStart = new Date(newDate);
      searchDateStart.setHours(0, 0, 0, 0);
      const searchDateEnd = new Date(newDate);
      searchDateEnd.setHours(23, 59, 59, 999);

      // Buscar reservas que se superpongan (excluyendo la reserva actual)
      const overlappingReservations = await Reservation.find({
        _id: { $ne: id }, // Excluir la reserva actual
        labId: labId,
        date: {
          $gte: searchDateStart,
          $lte: searchDateEnd
        },
        status: { $in: ['confirmed'] }
      });

      // Verificar si hay superposición con alguna reserva existente
      for (const existingReservation of overlappingReservations) {
        const [existingStartTime, existingEndTime] = existingReservation.timeSlot.split(' - ');
        const [existingStartHour, existingStartMinute] = existingStartTime.split(':').map(Number);
        const [existingEndHour, existingEndMinute] = existingEndTime.split(':').map(Number);
        
        const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
        const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

        // Verificar superposición
        if ((startMinutes < existingEndMinutes && endMinutes > existingStartMinutes)) {
          return next(new AppError(
            `El horario ${newTimeSlot} en la fecha ${new Date(newDate).toISOString().split('T')[0]} ya está ocupado por otra reserva.`, 
            400
          ));
        }
      }

      // Validar con reservas recurrentes activas (solo si NO estamos en semana de examen)
      // Obtener el día de la semana de manera segura para evitar problemas de zona horaria
      let dayOfWeek: number;
      const dateString = typeof newDate === 'string' ? newDate : newDate.toISOString().split('T')[0];
      try {
        dayOfWeek = getDayOfWeekFromDateString(dateString);
      } catch (error: any) {
        return next(new AppError(error.message || 'Formato de fecha inválido', 400));
      }
      
      const targetDate = new Date(newDate);
      
      const normalizedExamDate = new Date(targetDate);
      normalizedExamDate.setUTCHours(0, 0, 0, 0);
      const nextExamDay = new Date(normalizedExamDate);
      nextExamDay.setUTCDate(nextExamDay.getUTCDate() + 1);
      
      const isInExamWeek = await ExamWeek.findOne({
        startDate: { $lte: nextExamDay },
        endDate: { $gte: normalizedExamDate }
      });

      if (!isInExamWeek) {
        // Parsear la fecha string para comparar con los semestres
        const dateParts = dateString.split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const targetDateLocal = new Date(year, month, day);
        
        const activeSemesters = await Semester.find({ isActive: true });
        const activeSemesterIds = activeSemesters
          .filter(s => {
            // Normalizar fechas del semestre a medianoche local para comparar
            const semesterStart = new Date(s.startDate);
            semesterStart.setHours(0, 0, 0, 0);
            const semesterEnd = new Date(s.endDate);
            semesterEnd.setHours(0, 0, 0, 0);
            
            return targetDateLocal >= semesterStart && targetDateLocal <= semesterEnd;
          })
          .map(s => s._id);

        const recurringReservations = await RecurringReservation.find({
          labId: labId,
          dayOfWeek: dayOfWeek,
          semester: { $in: activeSemesterIds },
          isActive: true
        });

        for (const recurring of recurringReservations) {
          const [recurringStart, recurringEnd] = [recurring.startTime, recurring.endTime];
          const [recurringStartHour, recurringStartMinute] = recurringStart.split(':').map(Number);
          const [recurringEndHour, recurringEndMinute] = recurringEnd.split(':').map(Number);
          
          const recurringStartMinutes = recurringStartHour * 60 + recurringStartMinute;
          const recurringEndMinutes = recurringEndHour * 60 + recurringEndMinute;

          if (startMinutes < recurringEndMinutes && endMinutes > recurringStartMinutes) {
            return next(new AppError(
              `El horario se superpone con una reserva recurrente activa: ${recurringStart} - ${recurringEnd}`, 
              409
            ));
          }
        }
      }
    }

    // Validar capacidad si se están cambiando los asistentes
    if (attendees) {
      const lab = await Lab.findById(reservation.labId);
      if (!lab) {
        return next(new AppError('Laboratorio no encontrado.', 404));
      }
      if (attendees > lab.capacity) {
        return next(new AppError(`El número de asistentes excede la capacidad máxima del laboratorio (${lab.capacity}).`, 400));
      }
    }

    // Actualizar los campos
    if (date) {
      const updatedDate = new Date(date);
      updatedDate.setHours(0, 0, 0, 0);
      reservation.date = updatedDate;
    }
    if (timeSlot) {
      // Validar formato del timeSlot
      if (!timeSlot.includes(' - ')) {
        return next(new AppError('Formato de horario inválido. Debe ser "HH:MM - HH:MM"', 400));
      }
      reservation.timeSlot = timeSlot;
    }
    if (purpose !== undefined) reservation.purpose = purpose;
    if (attendees) reservation.attendees = attendees;
    if (status) reservation.status = status;

    await reservation.save();

    // Poblar los datos relacionados
    await reservation.populate('labId', 'name building floor capacity equipment');
    await reservation.populate('userId', 'email');

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

// Función para obtener horarios disponibles para un laboratorio en una fecha específica
export const getAvailableTimeSlotsForLab = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { labId, date } = req.query;
    
    if (!labId || !date) {
      return next(new AppError('labId y date son requeridos', 400));
    }

    // Generar horarios posibles según el día de la semana
    const allTimeSlots = [];
    // Obtener el día de la semana de manera segura para evitar problemas de zona horaria
    let dow: number;
    try {
      dow = getDayOfWeekFromDateString(String(date));
    } catch (error: any) {
      return next(new AppError(error.message || 'Formato de fecha inválido', 400));
    }
    const dt = new Date(String(date));

    // Domingos: no hay horarios disponibles
    if (dow === 0) {
      return res.status(200).json({ success: true, data: { availableSlots: [], allSlots: [] } });
    }

    // Verificar si es feriado: no hay horarios disponibles
    // Normalizar fecha a medianoche UTC para comparar solo el día
    const normalizedDate = new Date(dt);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(normalizedDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    
    const holiday = await Holiday.findOne({
      date: {
        $gte: normalizedDate,
        $lt: nextDay
      }
    });
    
    if (holiday) {
      return res.status(200).json({ success: true, data: { availableSlots: [], allSlots: [] } });
    }

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
    const existingReservations = await Reservation.find({
      labId: labId,
      date: date,
      status: { $in: ['confirmed'] }
    });

    // Obtener reservas recurrentes que apliquen para este día
    // IMPORTANTE: Las reservas recurrentes NO se aplican durante semanas de examen
    // Normalizar fecha a medianoche UTC para comparar solo el día
    const normalizedRecDate = new Date(dt);
    normalizedRecDate.setUTCHours(0, 0, 0, 0);
    const nextRecDay = new Date(normalizedRecDate);
    nextRecDay.setUTCDate(nextRecDay.getUTCDate() + 1);
    
    const isInExamWeek = await ExamWeek.findOne({
      startDate: { $lte: nextRecDay },
      endDate: { $gte: normalizedRecDate }
    });

    let recurring = [];
    // Solo obtener reservas recurrentes si NO estamos en una semana de examen
    if (!isInExamWeek) {
      const active = await Semester.find({ isActive: true });
      const activeIds = active
        .filter(s => {
          const d = new Date(dt.toISOString().split('T')[0]);
          const start = new Date(new Date(s.startDate).toISOString().split('T')[0]);
          const end = new Date(new Date(s.endDate).toISOString().split('T')[0]);
          return d >= start && d <= end;
        })
        .map(s => s._id);
      recurring = await RecurringReservation.find({ labId: labId, dayOfWeek: dow, semester: { $in: activeIds }, isActive: true });
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

export const getReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, labId, dateFrom, dateTo, userId } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (labId) filter.labId = labId;
    if (userId) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    const reservations = await Reservation.find(filter)
      .populate('labId')
      .populate('userId', 'email');
    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(new AppError('No autorizado', 401));
    const reservations = await Reservation.find({ userId: req.user.id })
      .populate('labId', 'name building floor capacity equipment')
      .populate('userId', 'email nombre apellido');
    
    // Formatear las reservas para enviar upcoming y past separadas
    const upcoming: any[] = [];
    const past: any[] = [];
    const now = new Date();
    
    reservations.forEach(reservation => {
      const reservationObj = reservation.toObject();
      // Normalizar el campo labId a lab para mantener compatibilidad con el frontend
      if (reservationObj.labId) {
        reservationObj.lab = reservationObj.labId;
      }
      if (new Date(reservation.date) >= now) {
        upcoming.push(reservationObj);
      } else {
        past.push(reservationObj);
      }
    });
    
    res.status(200).json({ 
      success: true, 
      data: {
        upcoming,
        past
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar que el usuario sea el propietario de la reserva o un admin
    if (reservation.userId.toString() !== req.user?.id && req.user?.role !== 'Admin') {
      throw new AppError('No tienes permisos para cancelar esta reserva', 403);
    }

    // Eliminar la reserva completamente de la base de datos
    await Reservation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada y eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Función para eliminar definitivamente una reserva completada
export const deleteReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    
    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Solo los admins pueden eliminar reservas
    if (req.user?.role !== 'Admin') {
      throw new AppError('Solo los administradores pueden eliminar reservas', 403);
    }

    // Solo se pueden eliminar reservas completadas
    if (reservation.status !== 'completed') {
      throw new AppError('Solo se pueden eliminar reservas completadas', 400);
    }

    // Eliminar la reserva completamente de la base de datos
    await Reservation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Reserva eliminada definitivamente'
    });
  } catch (error) {
    next(error);
  }
};