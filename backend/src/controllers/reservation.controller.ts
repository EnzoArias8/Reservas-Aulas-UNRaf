
import { Request, Response, NextFunction } from 'express';
import { Reservation } from '../models/Reservation.model';
import { Lab } from '../models/Lab.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

export const createReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { labId, date, timeSlot, purpose, attendees } = req.body;
    const userId = req.user._id;

    // Verificar que el laboratorio existe
    const lab = await Lab.findById(labId);
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    if (!lab.isActive) {
      throw new AppError('El laboratorio no está disponible', 400);
    }

    // Verificar capacidad
    if (attendees > lab.capacity) {
      throw new AppError(
        `El número de asistentes excede la capacidad del laboratorio (${lab.capacity})`,
        400
      );
    }

    // Verificar que la fecha no sea pasada
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new AppError('No se pueden hacer reservas para fechas pasadas', 400);
    }

    // Verificar si ya existe una reserva para ese horario
    const existingReservation = await Reservation.findOne({
      labId,
      date: reservationDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingReservation) {
      throw new AppError('Este horario ya está reservado', 400);
    }

    // Verificar límite de reservas por usuario (opcional)
    const userActiveReservations = await Reservation.countDocuments({
      userId,
      date: { $gte: today },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (userActiveReservations >= 5) {
      throw new AppError('Has alcanzado el límite de reservas activas (5)', 400);
    }

    // Crear la reserva
    const reservation = await Reservation.create({
      userId,
      labId,
      date: reservationDate,
      timeSlot,
      purpose,
      attendees,
      status: 'confirmed'
    });

    // Popular datos relacionados
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('userId', 'nombre email faculty role')
      .populate('labId', 'name building floor capacity');

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: populatedReservation
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, labId, dateFrom, dateTo, userId } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (labId) filter.labId = labId;
    if (userId) filter.userId = userId;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom as string);
      if (dateTo) filter.date.$lte = new Date(dateTo as string);
    }

    const reservations = await Reservation.find(filter)
      .populate('userId', 'nombre email faculty role')
      .populate('labId', 'name building floor capacity')
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      message: 'Reservas obtenidas exitosamente',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user._id;

    const reservations = await Reservation.find({ userId })
      .populate('labId', 'name building floor capacity equipment')
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      message: 'Tus reservas obtenidas exitosamente',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const reservations = await Reservation.find({ userId })
      .populate('labId', 'name building floor capacity')
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      message: 'Reservas del usuario obtenidas exitosamente',
      data: reservations,
      count: reservations.length
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'nombre email faculty role')
      .populate('labId', 'name building floor capacity equipment');

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar permisos (solo el dueño o admin/profesor)
    const isOwner = reservation.userId._id.toString() === req.user._id.toString();
    const isAdmin = ['Admin', 'Profesor'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('No tienes permisos para ver esta reserva', 403);
    }

    res.status(200).json({
      success: true,
      message: 'Reserva obtenida exitosamente',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar permisos
    const isOwner = reservation.userId.toString() === req.user._id.toString();
    const isAdmin = ['Admin', 'Profesor'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('No tienes permisos para modificar esta reserva', 403);
    }

    // No permitir editar reservas pasadas o canceladas
    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      throw new AppError('No se pueden modificar reservas canceladas o completadas', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservation.date < today) {
      throw new AppError('No se pueden modificar reservas pasadas', 400);
    }

    // Campos permitidos para actualizar
    const allowedUpdates = ['date', 'timeSlot', 'purpose', 'attendees'];
    const updates: any = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Si se cambia fecha o horario, verificar disponibilidad
    if (updates.date || updates.timeSlot) {
      const newDate = updates.date ? new Date(updates.date) : reservation.date;
      const newTimeSlot = updates.timeSlot || reservation.timeSlot;

      const conflictingReservation = await Reservation.findOne({
        _id: { $ne: req.params.id },
        labId: reservation.labId,
        date: newDate,
        timeSlot: newTimeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (conflictingReservation) {
        throw new AppError('El nuevo horario ya está reservado', 400);
      }
    }

    // Actualizar
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('userId', 'nombre email faculty role')
      .populate('labId', 'name building floor capacity');

    res.status(200).json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      data: updatedReservation
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar permisos
    const isOwner = reservation.userId.toString() === req.user._id.toString();
    const isAdmin = ['Admin', 'Profesor'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      throw new AppError('No tienes permisos para cancelar esta reserva', 403);
    }

    if (reservation.status === 'cancelled') {
      throw new AppError('Esta reserva ya está cancelada', 400);
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Solo admin puede eliminar completamente
    if (req.user.role !== 'Admin') {
      throw new AppError('Solo los administradores pueden eliminar reservas', 403);
    }

    await reservation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Reserva eliminada exitosamente',
      data: null
    });
  } catch (error) {
    next(error);
  }
};