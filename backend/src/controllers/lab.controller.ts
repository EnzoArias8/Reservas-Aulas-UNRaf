
import { Request, Response, NextFunction } from 'express';
import { Lab } from '../models/Lab.model';
import { Reservation } from '../models/Reservation.model';
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
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const labs = await Lab.find(filter).sort({ name: 1 });

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
    const lab = await Lab.findById(req.params.id);

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
    const lab = await Lab.create(req.body);

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
    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

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
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    // Verificar si hay reservas activas
    const activeReservations = await Reservation.countDocuments({
      labId: req.params.id,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeReservations > 0) {
      throw new AppError(
        'No se puede eliminar el laboratorio porque tiene reservas activas',
        400
      );
    }

    await lab.deleteOne();

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
    const lab = await Lab.findById(id);
    if (!lab) {
      throw new AppError('Laboratorio no encontrado', 404);
    }

    // Todos los horarios posibles
    const allTimeSlots = [
      '08:00 - 10:00',
      '10:00 - 12:00',
      '12:00 - 14:00',
      '14:00 - 16:00',
      '16:00 - 18:00',
      '18:00 - 20:00',
      '20:00 - 22:00'
    ];

    // Buscar reservas para ese laboratorio y fecha
    const reservations = await Reservation.find({
      labId: id,
      date: new Date(date as string),
      status: { $in: ['pending', 'confirmed'] }
    });

    // Obtener horarios reservados
    const reservedSlots = reservations.map(r => r.timeSlot);

    // Filtrar horarios disponibles
    const availableSlots = allTimeSlots.filter(
      slot => !reservedSlots.includes(slot)
    );

    res.status(200).json({
      success: true,
      message: 'Horarios disponibles obtenidos exitosamente',
      data: availableSlots
    });
  } catch (error) {
    next(error);
  }
};