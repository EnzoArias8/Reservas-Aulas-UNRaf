// ============================================
// utils/jwt.utils.ts
// ============================================
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

export const generateAccessToken = (userId: string): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET as string;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

export const generateRefreshToken = (userId: string): string => {
  const refreshSecret: jwt.Secret = process.env.JWT_REFRESH_SECRET as string;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET no está definido en las variables de entorno');
  }
  return jwt.sign({ id: userId }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

export const sendTokenResponse = (
  user: InstanceType<typeof User> & { _id: string },
  statusCode: number,
  res: Response,
  refreshToken?: string
): void => {
  const accessToken = generateAccessToken(user._id.toString());
  const finalRefreshToken = refreshToken || generateRefreshToken(user._id.toString());

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;

  res.cookie('token', accessToken, {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken: finalRefreshToken
  });
};