import { Request, Response, NextFunction } from 'express';
import { Reservation, IReservation } from '../models/Reservation.model';
import { Lab, ILab } from '../models/Lab.model';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

// Función para crear una nueva reserva
export const createReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { labId, date, timeSlot, purpose, attendees } = req.body;

    // 1. Validación de fecha: Evita reservas en el pasado
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer la hora a medianoche para comparar solo la fecha

    if (reservationDate < today) {
      return next(new AppError('No se puede crear una reserva en una fecha pasada.', 400));
    }

    // 2. Validación de superposición de reservas
    // Parsear el timeSlot para obtener inicio y fin
    const [startTime, endTime] = timeSlot.split(' - ');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Buscar reservas que se superpongan
    const existingReservations = await Reservation.find({
      labId,
      date: reservationDate,
      status: { $in: ['confirmed'] }
    });

    for (const reservation of existingReservations) {
      const [existingStart, existingEnd] = reservation.timeSlot.split(' - ');
      const [existingStartHour, existingStartMinute] = existingStart.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = existingEnd.split(':').map(Number);
      
      const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
      const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

      // Verificar superposición
      if (!(endMinutes <= existingStartMinutes || startMinutes >= existingEndMinutes)) {
        return next(new AppError('Este laboratorio ya está reservado en un horario que se superpone con tu selección.', 409));
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

    // Si se está cambiando la fecha o el horario, validar conflictos
    if ((date && date !== reservation.date) || (timeSlot && timeSlot !== reservation.timeSlot)) {
      const newDate = date || reservation.date;
      const newTimeSlot = timeSlot || reservation.timeSlot;
      const labId = reservation.labId;

      // Parsear el nuevo timeSlot para obtener inicio y fin
      const [startTime, endTime] = newTimeSlot.split(' - ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Buscar reservas que se superpongan (excluyendo la reserva actual)
      const overlappingReservations = await Reservation.find({
        _id: { $ne: id }, // Excluir la reserva actual
        labId: labId,
        date: newDate,
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
            `El horario ${newTimeSlot} en la fecha ${newDate} ya está ocupado por otra reserva.`, 
            400
          ));
        }
      }
    }

    // Actualizar los campos
    if (date) reservation.date = date;
    if (timeSlot) reservation.timeSlot = timeSlot;
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

    // Generar todos los horarios posibles de 15 minutos desde 08:00 hasta 23:00
    const allTimeSlots = [];
    for (let hour = 8; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 45 ? hour + 1 : hour;
        const endMinute = minute === 45 ? 0 : minute + 15;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        allTimeSlots.push(`${startTime} - ${endTime}`);
      }
    }

    // Obtener reservas existentes para este laboratorio en esta fecha
    const existingReservations = await Reservation.find({
      labId: labId,
      date: date,
      status: { $in: ['confirmed'] }
    });

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
      .populate('labId')
      .populate('userId', 'email');
    res.status(200).json({ success: true, data: reservations });
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