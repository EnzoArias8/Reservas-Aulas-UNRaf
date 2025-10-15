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
    const existingReservation = await Reservation.findOne({
      labId,
      date: reservationDate,
      timeSlot
    });

    if (existingReservation) {
      return next(new AppError('Este laboratorio ya está reservado para la fecha y hora seleccionadas.', 409));
    }

    // 3. Validación de capacidad
    const lab: ILab | null = await Lab.findById(labId);
    if (!lab) {
      return next(new AppError('Laboratorio no encontrado.', 404));
    }

    if (attendees > lab.capacity) {
      return next(new AppError(`El número de asistentes excede la capacidad máxima del laboratorio (${lab.capacity}).`, 400));
    }

    // Crear la reserva con el nuevo estado por defecto
    const newReservation = new Reservation({
      userId: req.user?.id,
      labId,
      date: reservationDate,
      timeSlot,
      purpose,
      attendees,
      status: 'pending' // Estado inicial de la reserva
    });

    await newReservation.save();

    res.status(201).json({
      status: 'success',
      data: {
        reservation: newReservation
      }
    });
  } catch (error) {
    next(error);
  }
};