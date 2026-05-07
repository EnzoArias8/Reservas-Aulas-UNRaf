
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('Error completo:', err);
  }

  // Error de Prisma - Registro no encontrado
  if (err.code === 'P2025') {
    const message = 'Recurso no encontrado';
    error = new AppError(message, 404);
  }

  // Error de Prisma - Duplicado
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'registro';
    const message = `Ya existe un registro con ese ${field}`;
    error = new AppError(message, 400);
  }

  // Error de validación de Prisma
  if (err.code === 'P2003') {
    const message = 'Error de validación de datos';
    error = new AppError(message, 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido. Por favor inicia sesión nuevamente';
    error = new AppError(message, 401);
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};