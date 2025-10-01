// ============================================
// controllers/auth.controller.ts
// ============================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  sendTokenResponse 
} from '../utils/jwt.utils';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nombre, email, password, faculty, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password,
      faculty,
      role: role || 'Estudiante'
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

    // Buscar usuario con password
    const user = await User.findOne({ email }).select('+password') as (InstanceType<typeof User> & { _id: string });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tu cuenta ha sido desactivada', 401);
    }

    // Generar refresh token y guardarlo
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Enviar respuesta con tokens
    sendTokenResponse(user, 200, res, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Limpiar refresh token del usuario
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });
    }

    // Limpiar cookies
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      data: null
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
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
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
    const allowedFields = ['nombre', 'faculty', 'telefono', 'carrera', 'semestre'];
    const updates: any = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
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
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      data: null
    });
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
      throw new AppError('Refresh token no proporcionado', 401);
    }

    // Verificar refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { id: string };

    // Buscar usuario
    const user = await User.findById(decoded.id).select('+refreshToken') as (InstanceType<typeof User> & { _id: string });

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Refresh token inválido', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tu cuenta ha sido desactivada', 401);
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};