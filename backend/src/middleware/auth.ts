import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authService from '../services/auth.service';
import { logger } from '../server';

// Расширить интерфейс Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

/**
 * Middleware для проверки JWT токена
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('❌ Token verification error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Middleware для проверки роли администратора
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin token required' });
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'smart-parking-diploma-secret-2026';
    const decoded = jwt.verify(token, secret) as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    (req as any).adminId = decoded.adminId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
};

/**
 * Middleware для обработки ошибок
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('❌ Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

/**
 * Middleware для логирования запросов
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
