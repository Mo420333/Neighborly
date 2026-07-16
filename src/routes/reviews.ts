import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create review
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  const { bookingId, rating, title, comment } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const review = await prisma.review.create({
    data: {
      bookingId,
      customerId: req.userId!,
      professionalId: booking.professionalId,
      rating,
      title,
      comment,
      verified: true,
    },
  });

  // Update professional rating
  const reviews = await prisma.review.findMany({
    where: { professionalId: booking.professionalId },
  });

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.professional.update({
    where: { id: booking.professionalId },
    data: {
      averageRating: avgRating,
      totalReviews: reviews.length,
    },
  });

  res.status(201).json(review);
});

export default router;
