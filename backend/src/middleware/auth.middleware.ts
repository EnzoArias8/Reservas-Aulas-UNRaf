import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';

// Extender la interfaz Request para incluir la propiedad 'user'
export interface AuthRequest extends Request {
  user?: { id: string; role: IUser['role'] };
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('No estás autenticado. Por favor, inicia sesión.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('El usuario perteneciente a este token ya no existe.', 401));
    }

    (req as AuthRequest).user = { id: currentUser.id, role: currentUser.role };
    next();
  } catch (error) {
    next(new AppError('Token inválido o expirado.', 401));
  }
};

export const authorize = (...roles: IUser['role'][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('No tienes permiso para realizar esta acción.', 403));
    }
    next();
  };
};