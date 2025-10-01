// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Obtener token del header Authorization
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // O del cookie
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('No estás autenticado. Por favor inicia sesión', 401);
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Verificar si el usuario existe
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new AppError('El usuario ya no existe', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tu cuenta ha sido desactivada', 401);
    }

    // Agregar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('No tienes permisos para realizar esta acción', 403)
      );
    }

    next();
  };
};