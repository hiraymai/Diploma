import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from '../services/auth.service';
import promoCodeService from '../services/promocode.service';
import parkingService from '../services/parking.service';
import { requireAdmin } from '../middleware/auth';
import { logger } from '../server';

const router = Router();
const prisma = new PrismaClient();

const getJwtSecret = () => process.env.JWT_SECRET || 'smart-parking-diploma-secret-2026';

// Default tariffs
const DEFAULT_TARIFFS: Record<string, string> = {
  SHORT_TERM_MIN_FEE: '150',
  SHORT_TERM_RATE_PER_MIN: '3',
  EXTEND_BOOKING_COST: '75',
  LONG_TERM_1: '700',
  LONG_TERM_3: '1800',
  LONG_TERM_5: '2700',
  LONG_TERM_7: '3500',
  LONG_TERM_14: '6000',
};

/** Seed default admin on first use */
async function ensureDefaultAdmin() {
  const count = await prisma.admin.count();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({ data: { username: 'admin', passwordHash } });
    logger.info('✅ Default admin created: admin / admin123');
  }
}
ensureDefaultAdmin().catch(() => {});

/**
 * POST /admin/auth/login
 * Публичный — авторизация администратора
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { adminId: admin.id, role: 'admin' },
      getJwtSecret(),
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { id: admin.id, username: admin.username }, message: '✅ Admin logged in' });
  } catch (error) {
    logger.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /admin/auth/change-password
 * Сменить пароль администратора
 */
router.post('/auth/change-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = (req as any).adminId;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Wrong current password' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: adminId }, data: { passwordHash } });

    res.json({ message: '✅ Password changed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ─── Все маршруты ниже требуют admin JWT ────────────────────────────────────
router.use(requireAdmin);

// ═══════════════════════════════════════════════════════════════════
// БЛОК 1 — Карта парковки (данные берутся из /parking/spots)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/parking/spots
 */
router.get('/parking/spots', async (req: Request, res: Response) => {
  try {
    const spots = await parkingService.getAllSpots();
    res.json(spots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

/**
 * POST /admin/parking/simulate-entry
 */
router.post('/parking/simulate-entry', async (req: Request, res: Response) => {
  try {
    const { spotNumber, carPlate } = req.body;
    const spot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { status: 'OCCUPIED', currentUserPlate: carPlate },
    });
    const { io } = await import('../server');
    io.emit('booking-created', { spotNumber, carPlate, status: 'OCCUPIED' });
    res.json({ success: true, spot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate entry' });
  }
});

/**
 * POST /admin/parking/simulate-exit
 */
router.post('/parking/simulate-exit', async (req: Request, res: Response) => {
  try {
    const { spotNumber } = req.body;
    const spot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { status: 'FREE', currentUserPlate: null, currentUserId: null },
    });
    const { io } = await import('../server');
    io.emit('booking-completed', { spotNumber, status: 'FREE' });
    res.json({ success: true, spot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate exit' });
  }
});

/**
 * POST /admin/parking/set-status
 */
router.post('/parking/set-status', async (req: Request, res: Response) => {
  try {
    const { spotNumber, status } = req.body;
    const valid = ['FREE', 'BOOKED', 'OCCUPIED', 'RESERVED', 'REPAIR'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status', valid });
    const spot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { status, currentUserPlate: status === 'FREE' ? null : undefined },
    });
    const { io } = await import('../server');
    io.emit('spot-updated', { spotNumber, status });
    res.json({ success: true, spot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set status' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// БЛОК 2 — Управление бронированиями
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/bookings
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: true, spot: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * POST /admin/bookings/:id/cancel
 */
router.post('/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const wasPending = ['PENDING', 'CONFIRMED'].includes(booking.status);

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.parkingSpot.update({
      where: { id: booking.spotId },
      data: { status: 'FREE', currentUserPlate: null, currentUserId: null },
    });

    if (wasPending) {
      await prisma.user.update({
        where: { id: booking.userId },
        data: { noShowCount: { increment: 1 } },
      });
    }

    res.json({ booking: updated, message: '✅ Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

/**
 * GET /admin/rentals
 */
router.get('/rentals', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const rentals = await prisma.longTermRental.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: true, spot: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

/**
 * POST /admin/rentals/:id/cancel
 */
router.post('/rentals/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rental = await prisma.longTermRental.findUnique({ where: { id } });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const updated = await prisma.longTermRental.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.parkingSpot.update({
      where: { id: rental.spotId },
      data: { status: 'FREE', currentUserPlate: null, currentUserId: null },
    });

    res.json({ rental: updated, message: '✅ Rental cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel rental' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// БЛОК 3 — Пользователи
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        bookings: { orderBy: { createdAt: 'desc' }, take: 5 },
        transactions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /admin/users/:id/unban
 */
router.post('/users/:id/unban', async (req: Request, res: Response) => {
  try {
    const user = await authService.unbanUser(req.params.id);
    res.json({ user, message: '✅ User unbanned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

/**
 * POST /admin/users/:id/reset-noshow
 */
router.post('/users/:id/reset-noshow', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { noShowCount: 0, isBanned: false, bannedUntil: null },
    });
    res.json({ user, message: '✅ No-show count reset' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset no-show count' });
  }
});

/**
 * POST /admin/wallet/deposit — пополнить кошелёк пользователя
 */
router.post('/wallet/deposit', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) return res.status(400).json({ error: 'Invalid params' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + Number(amount);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: balanceAfter },
    });

    await prisma.transaction.create({
      data: {
        userId,
        amount: Number(amount),
        type: 'DEPOSIT',
        description: 'Пополнение администратором',
        balanceBefore,
        balanceAfter,
      },
    });

    res.json({ user: updated, message: '✅ Wallet credited' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deposit' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// БЛОК 4 — Финансы и аналитика
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await parkingService.getParkingStats();
    const totalUsers = await prisma.user.count();
    const totalRevenue = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'PAYMENT' },
    });
    const bannedUsers = await prisma.user.count({ where: { isBanned: true } });
    res.json({ parking: stats, users: totalUsers, revenue: totalRevenue._sum.amount || 0, bannedUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /admin/finance?period=day|week|month
 */
router.get('/finance', async (req: Request, res: Response) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate: Date;

    if (period === 'day') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now); startDate.setDate(now.getDate() - 6); startDate.setHours(0, 0, 0, 0);
    }

    const transactions = await prisma.transaction.findMany({
      where: { type: 'PAYMENT', createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    });

    const abs = (n: number) => Math.abs(n);
    const totalRevenue = transactions.reduce((s, t) => s + abs(t.amount), 0);

    let shortTermRevenue = 0, longTermRevenue = 0;
    for (const t of transactions) {
      const d = (t.description || '').toLowerCase();
      if (d.includes('долгосроч') || d.includes('rental') || d.includes('long')) longTermRevenue += abs(t.amount);
      else shortTermRevenue += abs(t.amount);
    }

    const dailyMap: Record<string, number> = {};
    for (const t of transactions) {
      // Use local date string to avoid UTC shift
      const local = new Date(t.createdAt.getTime() - t.createdAt.getTimezoneOffset() * 60000);
      const day = local.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + abs(t.amount);
    }

    const days = period === 'day' ? 1 : period === 'month' ? 30 : 7;
    // Build chart ending TODAY (index days-1 = today)
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const chartData = Array.from({ length: days }, (_, i) => {
      const d = new Date(todayStart.getTime() - (days - 1 - i) * 86400000);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const key = local.toISOString().slice(0, 10);
      return { date: key, revenue: dailyMap[key] || 0 };
    });

    const bannedStats = await prisma.user.aggregate({
      _sum: { noShowCount: true },
      _count: { isBanned: true },
    });

    res.json({
      period, totalRevenue,
      breakdown: { shortTerm: shortTermRevenue, longTerm: longTermRevenue },
      chartData,
      bannedUsers: await prisma.user.count({ where: { isBanned: true } }),
      totalNoShows: bannedStats._sum.noShowCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch finance data' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// БЛОК 5 — Промокоды и системные настройки (тарифы)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/promo-codes
 */
router.get('/promo-codes', async (req: Request, res: Response) => {
  try {
    const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(promoCodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

/**
 * POST /admin/promo
 */
router.post('/promo', async (req: Request, res: Response) => {
  try {
    const promo = await promoCodeService.createPromoCode(req.body);
    res.status(201).json({ promo, message: '✅ Promo code created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo' });
  }
});

/**
 * GET /admin/tariffs
 */
router.get('/tariffs', async (req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const tariffs = { ...DEFAULT_TARIFFS };
    for (const c of configs) {
      tariffs[c.key] = c.value;
    }
    res.json(tariffs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tariffs' });
  }
});

/**
 * PUT /admin/tariffs
 */
router.put('/tariffs', async (req: Request, res: Response) => {
  try {
    const updates: Record<string, string> = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    res.json({ message: '✅ Tariffs updated', tariffs: updates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tariffs' });
  }
});

export default router;
