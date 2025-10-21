import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, apellido, email, password, telefono, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      telefono,
      role: role || 'Profesor',
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      data: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
        telefono: user.telefono,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, role, isActive } = req.query as { q?: string; role?: string; isActive?: string };
    const filter: any = {};
    if (q) {
      filter.$or = [
        { nombre: { $regex: q, $options: 'i' } },
        { apellido: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter).select('+isActive');
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const allowed = ['nombre', 'apellido', 'role', 'isActive', 'telefono'];
    const updates: any = {};
    Object.keys(req.body || {}).forEach((k) => {
      if (allowed.includes(k)) updates[k] = (req.body as any)[k];
    });

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};


