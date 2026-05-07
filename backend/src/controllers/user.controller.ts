import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, apellido, email, password, telefono, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        telefono,
        role: role || 'Profesor',
        isActive: true
      }
    });

    res.status(201).json({ 
      success: true, 
      data: {
        id: user.id,
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
      filter.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        telefono: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
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

    const user = await prisma.user.update({
      where: { id },
      data: updates
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.delete({
      where: { id }
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};
