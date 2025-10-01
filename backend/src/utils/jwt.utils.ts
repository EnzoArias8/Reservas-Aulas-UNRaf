import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET! as string, {
    expiresIn: process.env.JWT_EXPIRE ? String(process.env.JWT_EXPIRE) : '15m'
  });
};

export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
  const refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

  return jwt.sign({ id: userId }, refreshSecret, {
    expiresIn: refreshExpire
  });
};

export const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response,
  refreshToken?: string
): void => {
  const accessToken = generateAccessToken(user._id.toString());
  const newRefreshToken = refreshToken || generateRefreshToken(user._id.toString());

  // Opciones de cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + (Number(process.env.COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  };

  // Enviar cookie
  res.cookie('token', accessToken, cookieOptions);
  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  // Remover password del output
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    message: 'Operación exitosa',
    data: {
      user: userObj,
      accessToken,
      refreshToken: newRefreshToken
    }
  });
};