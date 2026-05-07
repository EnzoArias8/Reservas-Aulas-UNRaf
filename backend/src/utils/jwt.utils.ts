// ============================================
// utils/jwt.utils.ts
// ============================================
import { Response } from 'express';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  const payload = { id: userId };
  const options: jwt.SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET no está definido en las variables de entorno');
  }
  const payload = { id: userId };
  const options: jwt.SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, refreshSecret, options);
};

export const sendTokenResponse = (
  user: { id: string },
  statusCode: number,
  res: Response,
  refreshToken?: string
): void => {
  const accessToken = generateAccessToken(user.id);
  const finalRefreshToken = refreshToken || generateRefreshToken(user.id);

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