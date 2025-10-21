
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

    // Generar horarios de 15 minutos desde las 08:00 hasta las 23:00
    const allTimeSlots = [];
    for (let hour = 8; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 23 && minute > 0) break; // No pasar de las 23:00
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 15;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const endMinuteAdjusted = endMinute >= 60 ? endMinute - 60 : endMinute;
        
        if (endHour <= 23) {
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinuteAdjusted.toString().padStart(2, '0')}`;
          allTimeSlots.push(`${startTime} - ${endTime}`);
        }
      }
    }

    // Buscar reservas para ese laboratorio y fecha
    const reservations = await Reservation.find({
      labId: id,
      date: new Date(date as string),
      status: { $in: ['pending', 'confirmed'] }
    });

    // Función para verificar si un slot se superpone con reservas existentes
    const isSlotAvailable = (slot: string) => {
      const [startTime, endTime] = slot.split(' - ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Verificar si este slot se superpone con alguna reserva existente
      for (const reservation of reservations) {
        const [existingStart, existingEnd] = reservation.timeSlot.split(' - ');
        const [existingStartHour, existingStartMinute] = existingStart.split(':').map(Number);
        const [existingEndHour, existingEndMinute] = existingEnd.split(':').map(Number);
        
        const existingStartMinutes = existingStartHour * 60 + existingStartMinute;
        const existingEndMinutes = existingEndHour * 60 + existingEndMinute;

        // Verificar superposición: si hay intersección, el slot no está disponible
        if (!(endMinutes <= existingStartMinutes || startMinutes >= existingEndMinutes)) {
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
      data: availableSlots
    });
  } catch (error) {
    next(error);
  }
};