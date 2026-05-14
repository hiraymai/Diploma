import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import authService from '../services/auth.service';
import { verifyToken } from '../middleware/auth';
import { logger } from '../server';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /auth/send-otp
 * Генерирует 4-значный OTP и сохраняет в БД (действует 5 минут)
 */
router.post('/send-otp',
  [body('phoneNumber').isString().trim().matches(/^\+\d{1,15}$/).withMessage('Invalid phone number')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phoneNumber } = req.body;

    // Инвалидировать старые коды
    await prisma.otpCode.updateMany({
      where: { phoneNumber, isUsed: false },
      data: { isUsed: true },
    });

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    await prisma.otpCode.create({ data: { phoneNumber, code, expiresAt } });

    logger.info(`[OTP] ${phoneNumber} → ${code}`);

    // demo: возвращаем код для отображения в UI
    res.json({ message: 'OTP sent', expiresIn: 300, demoCode: code });
  }
);

/**
 * POST /auth/verify-otp
 * Проверяет OTP, авто-регистрирует если новый пользователь, возвращает JWT
 */
router.post('/verify-otp',
  [
    body('phoneNumber').isString().trim().matches(/^\+\d{1,15}$/),
    body('code').isString().trim().isLength({ min: 4, max: 4 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phoneNumber, code } = req.body;

    const otp = await prisma.otpCode.findFirst({
      where: { phoneNumber, code, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Пометить код как использованный
    await prisma.otpCode.update({ where: { id: otp.id }, data: { isUsed: true } });

    // Найти или создать пользователя
    let user = await authService.findUserByPhone(phoneNumber);
    let isNewUser = false;
    if (!user) {
      user = await authService.registerUser(phoneNumber);
      isNewUser = true;
    }

    // Проверить бан
    const isBanned = await authService.isUserBanned(user.id);
    if (isBanned) return res.status(403).json({ error: 'User is banned' });

    const token = authService.generateToken(user.id);

    res.json({ user, token, isNewUser, message: '✅ Logged in successfully' });
  }
);

/**
 * POST /auth/register
 * Регистрация нового пользователя
 */
router.post(
  '/register',
  [
    body('phoneNumber')
      .isString()
      .trim()
      .matches(/^\+\d{1,15}$/)
      .withMessage('Invalid phone number'),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneNumber, firstName, lastName } = req.body;

      // Попытаться зарегистрировать пользователя
      const user = await authService.registerUser(phoneNumber, firstName, lastName);

      // Сгенерировать токен
      const token = authService.generateToken(user.id);

      res.json({
        user,
        token,
        message: '✅ Registered successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        return res.status(400).json({ error: 'User already exists' });
      }
      logger.error('❌ Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /auth/login
 * Вход пользователя
 */
router.post(
  '/login',
  [
    body('phoneNumber')
      .isString()
      .trim()
      .matches(/^\+\d{1,15}$/)
      .withMessage('Invalid phone number'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phoneNumber } = req.body;

      // Найти пользователя
      const user = await authService.findUserByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Проверить, забанен ли
      const isBanned = await authService.isUserBanned(user.id);
      if (isBanned) {
        return res.status(403).json({ error: 'User is banned' });
      }

      // Сгенерировать токен
      const token = authService.generateToken(user.id);

      res.json({
        user,
        token,
        message: '✅ Logged in successfully',
      });
    } catch (error) {
      logger.error('❌ Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * GET /auth/me
 * Получить информацию о текущем пользователе
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserProfile(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /auth/me
 * Обновить профиль пользователя
 */
router.put(
  '/me',
  verifyToken,
  [
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('email').optional().isEmail(),
    body('carPlate').optional().isString().trim().toUpperCase(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { firstName, lastName, email, carPlate } = req.body;

      const updatedUser = await authService.updateUserProfile(req.userId, {
        firstName,
        lastName,
        email,
        carPlate,
      });

      res.json({
        user: updatedUser,
        message: '✅ Profile updated',
      });
    } catch (error) {
      logger.error('❌ Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * GET /auth/verify-token
 * Проверить валидность токена
 */
router.get('/verify-token', verifyToken, (req: Request, res: Response) => {
  res.json({
    valid: true,
    userId: req.userId,
  });
});

export default router;
