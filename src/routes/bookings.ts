import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create booking
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  const { professionalId, title, description, scheduledDate, duration, location, price } = req.body;

  const booking = await prisma.booking.create({
    data: {
      customerId: req.userId!,
      professionalId,
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      duration,
      location,
      price,
      status: 'PENDING',
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      professional: { select: { businessName: true, user: { select: { email: true } } } },
    },
  });

  res.status(201).json(booking);
});

// Get user's bookings
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  const { status, role } = req.query;

  const where: any = role === 'PROFESSIONAL' ? { professionalId: req.userId } : { customerId: req.userId };
  if (status) where.status = status;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      professional: { select: { businessName: true } },
    },
    orderBy: { scheduledDate: 'desc' },
  });

  res.json(bookings);
});

// Update booking status
router.patch('/:id/status', verifyToken, async (req: AuthRequest, res) => {
  const { status } = req.body;

  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status },
  });

  res.json(booking);
});

export default router;
