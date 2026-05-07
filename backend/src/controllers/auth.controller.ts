// ============================================
// controllers/auth.controller.ts
// ============================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  sendTokenResponse 
} from '../utils/jwt.utils';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nombre, apellido, email, password, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password,
        role: role || 'Profesor'
      }
    });

    // Generar tokens y enviar respuesta
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Verificar si el email y password fueron proporcionados
    if (!email || !password) {
      throw new AppError('Por favor ingresa email y contraseña', 400);
    }

    // Buscar usuario incluyendo password
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Email o contraseña incorrectos', 401);
    }

    // Generar tokens y enviar respuesta
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token no proporcionado', 400);
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { id: string };

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Generar nuevos tokens
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Actualizar refresh token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { nombre, apellido, telefono } = req.body;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(telefono !== undefined && { telefono })
      },
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

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError('La contraseña actual y la nueva son requeridas', 400);
    }

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta', 400);
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
