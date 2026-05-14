import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import parkingService from '../services/parking.service';
import { verifyToken } from '../middleware/auth';
import { logger } from '../server';

const prisma = new PrismaClient();

const router = Router();

/**
 * GET /parking/spots
 * Получить все места парковки (красивый табличный формат)
 */
router.get('/spots', async (req: Request, res: Response) => {
  try {
    const spots = await parkingService.getAllSpots();
    
    // Создаем табличный формат
    const createTable = (spotsList: any[], type: string) => {
      const table = [];
      const statusIcons = {
        'FREE': '🟢',
        'BOOKED': '🟡', 
        'OCCUPIED': '🔴',
        'RESERVED': '🟠',
        'REPAIR': '🔧'
      };
      
      const statusText = {
        'FREE': 'Свободно',
        'BOOKED': 'Забронировано',
        'OCCUPIED': 'Занято',
        'RESERVED': 'Резерв',
        'REPAIR': 'Ремонт'
      };
      
      for (let i = 0; i < spotsList.length; i += 5) {
        const row = [];
        for (let j = 0; j < 5 && i + j < spotsList.length; j++) {
          const spot = spotsList[i + j];
          row.push({
            spotNumber: spot.spotNumber,
            icon: statusIcons[spot.status as keyof typeof statusIcons] || '⚪',
            status: statusText[spot.status as keyof typeof statusText] || 'Неизвестно',
            carPlate: spot.currentUserPlate || '-',
            type: type
          });
        }
        table.push(row);
      }
      return table;
    };
    
    const shortTermSpots = spots.filter(s => s.type === 'SHORT_TERM').sort((a, b) => a.spotNumber.localeCompare(b.spotNumber));
    const longTermSpots = spots.filter(s => s.type === 'LONG_TERM').sort((a, b) => a.spotNumber.localeCompare(b.spotNumber));
    
    const shortTermTable = createTable(shortTermSpots, 'SHORT_TERM');
    const longTermTable = createTable(longTermSpots, 'LONG_TERM');
    
    // Статистика
    const stats = {
      total: spots.length,
      shortTerm: {
        total: shortTermSpots.length,
        free: shortTermSpots.filter(s => s.status === 'FREE').length,
        booked: shortTermSpots.filter(s => s.status === 'BOOKED').length,
        occupied: shortTermSpots.filter(s => s.status === 'OCCUPIED').length,
        repair: shortTermSpots.filter(s => s.status === 'REPAIR').length
      },
      longTerm: {
        total: longTermSpots.length,
        free: longTermSpots.filter(s => s.status === 'FREE').length,
        booked: longTermSpots.filter(s => s.status === 'BOOKED').length,
        occupied: longTermSpots.filter(s => s.status === 'OCCUPIED').length,
        repair: longTermSpots.filter(s => s.status === 'REPAIR').length
      }
    };
    
    const result = {
      title: '🚗 Парковка QPark - Текущий статус',
      lastUpdated: new Date().toLocaleString('ru-RU'),
      legend: {
        '🟢': 'Свободно',
        '🟡': 'Забронировано',
        '🔴': 'Занято',
        '🟠': 'Резерв',
        '🔧': 'Ремонт'
      },
      statistics: stats,
      tables: {
        shortTerm: {
          title: '🅿️ Краткосрочная парковка',
          table: shortTermTable
        },
        longTerm: {
          title: '🅿️ Долгосрочная парковка',
          table: longTermTable
        }
      }
    };
    
    res.json(result);
  } catch (error) {
    logger.error('❌ Error fetching spots:', error);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

/**
 * GET /parking/spots/available
 * Получить свободные места
 */
router.get('/spots/available', async (req: Request, res: Response) => {
  try {
    const { type = 'SHORT_TERM' } = req.query;
    const spots = await parkingService.getAvailableSpots(type as 'SHORT_TERM' | 'LONG_TERM');
    res.json(spots);
  } catch (error) {
    logger.error('❌ Error fetching available spots:', error);
    res.status(500).json({ error: 'Failed to fetch available spots' });
  }
});


/**
 * POST /parking/lpr/entry
 * Обработка LPR события - въезд
 */
router.post('/lpr/entry', async (req: Request, res: Response) => {
  try {
    const { carPlate, spotNumber } = req.body;
    
    if (!carPlate || !spotNumber) {
      return res.status(400).json({ error: 'carPlate and spotNumber are required' });
    }
    
    const result = await parkingService.handleLPREntry(carPlate, spotNumber);
    res.json(result);
  } catch (error) {
    logger.error('❌ Error handling LPR entry:', error);
    res.status(500).json({ error: 'Failed to process entry' });
  }
});

/**
 * POST /parking/simulate-entry
 * Удобный endpoint для симуляции въезда
 */
router.post('/simulate-entry', async (req: Request, res: Response) => {
  try {
    const { spotNumber, carPlate } = req.body;

    if (!spotNumber || !carPlate) {
      return res.status(400).json({
        error: 'spotNumber and carPlate are required',
        example: { spotNumber: "SP-02", carPlate: "777ABC01" }
      });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const spot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { status: 'OCCUPIED', currentUserPlate: carPlate },
    });

    const { io } = await import('../server');
    io.emit('booking-created', { spotNumber, carPlate, status: 'OCCUPIED' });

    res.json({
      success: true,
      message: `Car ${carPlate} entered spot ${spotNumber}`,
      spot,
    });
  } catch (error) {
    logger.error('❌ Error simulating entry:', error);
    res.status(500).json({ error: 'Failed to simulate entry' });
  }
});

/**
 * POST /parking/set-status
 * Установить статус места (для тестирования)
 */
router.post('/set-status', async (req: Request, res: Response) => {
  try {
    const { spotNumber, status } = req.body;
    
    if (!spotNumber || !status) {
      return res.status(400).json({ 
        error: 'spotNumber and status are required',
        example: {
          spotNumber: "SP-03",
          status: "REPAIR"
        },
        availableStatuses: ['FREE', 'BOOKED', 'OCCUPIED', 'RESERVED', 'REPAIR']
      });
    }
    
    const validStatuses = ['FREE', 'BOOKED', 'OCCUPIED', 'RESERVED', 'REPAIR'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        availableStatuses: validStatuses
      });
    }
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const updatedSpot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { 
        status,
        currentUserPlate: status === 'FREE' ? null : undefined,
        currentUserId: status === 'FREE' ? null : undefined
      }
    });
    
    res.json({
      success: true,
      message: `Spot ${spotNumber} status set to ${status}`,
      spot: {
        spotNumber: updatedSpot.spotNumber,
        status: updatedSpot.status,
        currentUserPlate: updatedSpot.currentUserPlate
      }
    });
  } catch (error) {
    logger.error('❌ Error setting spot status:', error);
    res.status(500).json({ error: 'Failed to set spot status' });
  }
});

/**
 * GET /parking/spots/simple
 * Простой вывод без таблиц
 */
router.get('/spots/simple', async (req: Request, res: Response) => {
  try {
    const spots = await parkingService.getAllSpots();
    const simpleSpots = spots.map(s => ({
      spotNumber: s.spotNumber,
      type: s.type,
      status: s.status,
      carPlate: s.currentUserPlate || '-'
    }));
    res.json(simpleSpots);
  } catch (error) {
    logger.error('❌ Error fetching spots:', error);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

/**
 * GET /parking/spots/text
 * Текстовое представление таблицы
 */
router.get('/spots/text', async (req: Request, res: Response) => {
  try {
    const spots = await parkingService.getAllSpots();
    const shortTermSpots = spots.filter(s => s.type === 'SHORT_TERM').sort((a, b) => a.spotNumber.localeCompare(b.spotNumber));
    const longTermSpots = spots.filter(s => s.type === 'LONG_TERM').sort((a, b) => a.spotNumber.localeCompare(b.spotNumber));
    
    const statusIcons = {
      'FREE': '🟢',
      'BOOKED': '🟡', 
      'OCCUPIED': '🔴',
      'RESERVED': '🟠',
      'REPAIR': '🔧'
    };
    
    let textOutput = '\n🚗 ПАРКОВКА QPARK - ТЕКУЩИЙ СТАТУС\n';
    textOutput += '=' .repeat(50) + '\n\n';
    
    // Легенда
    textOutput += '📍 ЛЕГЕНДА:\n';
    Object.entries(statusIcons).forEach(([status, icon]) => {
      const statusText = {
        'FREE': 'Свободно',
        'BOOKED': 'Забронировано',
        'OCCUPIED': 'Занято',
        'RESERVED': 'Резерв',
        'REPAIR': 'Ремонт'
      }[status];
      textOutput += `   ${icon} ${statusText}\n`;
    });
    textOutput += '\n';
    
    // Краткосрочная парковка
    textOutput += '🅿️ КРАТКОСРОЧНАЯ ПАРКОВКА:\n';
    textOutput += '-'.repeat(40) + '\n';
    
    for (let i = 0; i < shortTermSpots.length; i += 5) {
      textOutput += '   ';
      for (let j = 0; j < 5 && i + j < shortTermSpots.length; j++) {
        const spot = shortTermSpots[i + j];
        const icon = statusIcons[spot.status as keyof typeof statusIcons] || '⚪';
        textOutput += `${icon} ${spot.spotNumber.padEnd(8)}`;
      }
      textOutput += '\n';
    }
    textOutput += '\n';
    
    // Долгосрочная парковка
    textOutput += '🅿️ ДОЛГОСРОЧНАЯ ПАРКОВКА:\n';
    textOutput += '-'.repeat(40) + '\n';
    
    for (let i = 0; i < longTermSpots.length; i += 5) {
      textOutput += '   ';
      for (let j = 0; j < 5 && i + j < longTermSpots.length; j++) {
        const spot = longTermSpots[i + j];
        const icon = statusIcons[spot.status as keyof typeof statusIcons] || '⚪';
        textOutput += `${icon} ${spot.spotNumber.padEnd(8)}`;
      }
      textOutput += '\n';
    }
    textOutput += '\n';
    
    // Статистика
    const stats = {
      totalFree: spots.filter(s => s.status === 'FREE').length,
      totalBooked: spots.filter(s => s.status === 'BOOKED').length,
      totalOccupied: spots.filter(s => s.status === 'OCCUPIED').length,
      totalRepair: spots.filter(s => s.status === 'REPAIR').length
    };
    
    textOutput += '📊 СТАТИСТИКА:\n';
    textOutput += '=' .repeat(30) + '\n';
    textOutput += `   🟢 Свободно:     ${stats.totalFree}\n`;
    textOutput += `   🟡 Забронировано: ${stats.totalBooked}\n`;
    textOutput += `   🔴 Занято:       ${stats.totalOccupied}\n`;
    textOutput += `   🔧 На ремонте:   ${stats.totalRepair}\n`;
    textOutput += '\n';
    textOutput += `🕐 Обновлено: ${new Date().toLocaleString('ru-RU')}\n`;
    
    res.json({ 
      title: '🚗 Парковка QPark - Текущий статус',
      textTable: textOutput,
      lastUpdated: new Date().toLocaleString('ru-RU')
    });
  } catch (error) {
    logger.error('❌ Error generating text table:', error);
    res.status(500).json({ error: 'Failed to generate text table' });
  }
});

/**
 * POST /parking/simulate-exit
 * Симуляция выезда для демо (без проверки бронирования)
 */
router.post('/simulate-exit', async (req: Request, res: Response) => {
  try {
    const { spotNumber } = req.body;

    if (!spotNumber) {
      return res.status(400).json({ error: 'spotNumber is required' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const spot = await prisma.parkingSpot.update({
      where: { spotNumber },
      data: { status: 'FREE', currentUserPlate: null, currentUserId: null },
    });

    const { io } = await import('../server');
    io.emit('booking-completed', { spotNumber, status: 'FREE' });

    res.json({ success: true, message: `Spot ${spotNumber} is now free`, spot });
  } catch (error) {
    logger.error('❌ Error simulating exit:', error);
    res.status(500).json({ error: 'Failed to simulate exit' });
  }
});

/**
 * POST /parking/lpr/exit
 * Обработка LPR события - выезд
 */
router.post('/lpr/exit', async (req: Request, res: Response) => {
  try {
    const { carPlate, spotNumber } = req.body;
    
    if (!carPlate || !spotNumber) {
      return res.status(400).json({ error: 'carPlate and spotNumber are required' });
    }
    
    const result = await parkingService.handleLPRExit(carPlate, spotNumber);
    res.json(result);
  } catch (error) {
    logger.error('❌ Error handling LPR exit:', error);
    res.status(500).json({ error: 'Failed to process exit' });
  }
});

/**
 * GET /parking/stats
 * Получить статистику парковки
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await parkingService.getParkingStats();
    res.json(stats);
  } catch (error) {
    logger.error('❌ Error fetching parking stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /parking/initialize
 * Инициализировать места парковки (для разработки)
 */
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    await parkingService.initializeParkingSpots();
    res.json({ message: 'Parking spots initialized successfully' });
  } catch (error) {
    logger.error('❌ Error initializing parking spots:', error);
    res.status(500).json({ error: 'Failed to initialize spots' });
  }
});

/**
 * GET /parking/spots/:spotNumber
 * Получить место по номеру (должен быть в конце!)
 */
router.get('/spots/:spotNumber', async (req: Request, res: Response) => {
  try {
    const { spotNumber } = req.params;
    const spot = await parkingService.getSpotByNumber(spotNumber);
    
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    
    res.json(spot);
  } catch (error) {
    logger.error('❌ Error fetching spot:', error);
    res.status(500).json({ error: 'Failed to fetch spot' });
  }
});

/**
 * POST /parking/book
 * Создать краткосрочное бронирование (требует JWT)
 */
router.post('/book', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { spotNumber, carPlate } = req.body;
    if (!spotNumber || !carPlate) {
      return res.status(400).json({ error: 'spotNumber and carPlate required' });
    }

    const spot = await prisma.parkingSpot.findUnique({ where: { spotNumber } });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.status !== 'FREE') return res.status(409).json({ error: 'Spot is not available' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBanned) return res.status(403).json({ error: 'User is banned' });

    const startTime = new Date();
    const estimatedEndTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 min window

    const booking = await prisma.booking.create({
      data: {
        userId,
        spotId: spot.id,
        startTime,
        estimatedEndTime,
        status: 'CONFIRMED',
        isPaid: false,
        totalCost: 150,
      },
      include: { spot: true },
    });

    await prisma.parkingSpot.update({
      where: { id: spot.id },
      data: { status: 'BOOKED', currentUserPlate: carPlate, currentUserId: null },
    });

    // Save/update carPlate on user
    await prisma.user.update({ where: { id: userId }, data: { carPlate } });

    const { io } = await import('../server');
    io.emit('booking-created', { spotNumber, carPlate, bookingId: booking.id, status: 'BOOKED' });

    res.json({ success: true, booking });
  } catch (error: any) {
    console.error('❌ Book error:', error?.message, error?.code, error?.meta);
    res.status(500).json({ error: error?.message || 'Failed to create booking' });
  }
});

/**
 * POST /parking/rent
 * Создать долгосрочную аренду (требует JWT)
 */
router.post('/rent', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { spotNumber, carPlate, rentalDays } = req.body;
    if (!spotNumber || !carPlate || !rentalDays) {
      return res.status(400).json({ error: 'spotNumber, carPlate and rentalDays required' });
    }

    const spot = await prisma.parkingSpot.findUnique({ where: { spotNumber } });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.status !== 'FREE') return res.status(409).json({ error: 'Spot is not available' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBanned) return res.status(403).json({ error: 'User is banned' });

    const pricingMap: Record<number, number> = { 1: 700, 3: 1800, 5: 2700, 7: 3500, 14: 6000 };
    const totalCost = pricingMap[rentalDays] ?? rentalDays * 500;

    if (user.walletBalance < totalCost) {
      return res.status(402).json({ error: 'Insufficient wallet balance' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + rentalDays * 24 * 60 * 60 * 1000);

    const rental = await prisma.longTermRental.create({
      data: { userId, spotId: spot.id, rentalDays, totalCost, startDate, endDate, isPaid: true, status: 'ACTIVE' },
      include: { spot: true },
    });

    const userBeforeRent = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: totalCost }, carPlate },
    });

    await prisma.transaction.create({
      data: {
        userId, amount: totalCost, type: 'PAYMENT',
        description: `Long-term rental ${spotNumber} (${rentalDays} days)`,
        balanceBefore: userBeforeRent?.walletBalance ?? 0,
        balanceAfter: (userBeforeRent?.walletBalance ?? 0) - totalCost,
      },
    });

    await prisma.parkingSpot.update({
      where: { id: spot.id },
      data: { status: 'RESERVED', currentUserPlate: carPlate },
    });

    const { io } = await import('../server');
    io.emit('rental-created', { spotNumber, carPlate, rentalId: rental.id, status: 'RESERVED' });

    res.json({ success: true, rental });
  } catch (error) {
    logger.error('❌ Rent error:', error);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

/**
 * GET /parking/my-bookings
 * Мои бронирования и аренды (требует JWT)
 */
router.get('/my-bookings', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { spot: true },
      orderBy: { createdAt: 'desc' },
    });
    const rentals = await prisma.longTermRental.findMany({
      where: { userId },
      include: { spot: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ bookings, rentals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * POST /parking/bookings/:id/cancel
 * Отменить бронирование (требует JWT)
 */
router.post('/bookings/:id/cancel', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', actualEndTime: new Date() },
      include: { spot: true },
    });
    await prisma.parkingSpot.update({
      where: { id: booking.spotId },
      data: { status: 'FREE', currentUserPlate: null },
    });
    const { io } = await import('../server');
    io.emit('booking-cancelled', { spotNumber: booking.spot.spotNumber, status: 'FREE' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

/**
 * POST /parking/bookings/:id/complete
 * Завершить бронирование с оплатой (требует JWT)
 */
router.post('/bookings/:id/complete', verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cost = 150 } = req.body;
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({ where: { id }, include: { spot: true } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const finalCost = Math.max(cost, 150);
    const cashback = Math.floor(finalCost * 0.01);

    await prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED', actualEndTime: new Date(), totalCost: finalCost, isPaid: true },
    });

    const userBeforeComplete = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: finalCost - cashback } },
    });

    await prisma.transaction.create({
      data: {
        userId, amount: finalCost, type: 'PAYMENT',
        description: `Short-term parking ${booking.spot.spotNumber}`,
        balanceBefore: userBeforeComplete?.walletBalance ?? 0,
        balanceAfter: (userBeforeComplete?.walletBalance ?? 0) - (finalCost - cashback),
      },
    });

    await prisma.parkingSpot.update({
      where: { id: booking.spotId },
      data: { status: 'FREE', currentUserPlate: null },
    });

    const { io } = await import('../server');
    io.emit('booking-completed', { spotNumber: booking.spot.spotNumber, status: 'FREE' });

    res.json({ success: true, finalCost, cashback });
  } catch (error: any) {
    console.error('❌ Complete booking error:', error?.message);
    res.status(500).json({ error: 'Failed to complete booking' });
  }
});

export default router;
