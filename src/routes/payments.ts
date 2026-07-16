import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create payment intent
router.post('/intent', verifyToken, async (req: AuthRequest, res) => {
  const { bookingId, amount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata: { bookingId },
  });

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      customerId: req.userId!,
      amount,
      status: 'PROCESSING',
      stripePaymentId: paymentIntent.id,
      paymentMethod: 'CREDIT_CARD',
    },
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
  });
});

// Confirm payment
router.post('/confirm', verifyToken, async (req: AuthRequest, res) => {
  const { paymentId, paymentIntentId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
      include: { booking: true },
    });

    // Update booking
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
    });

    res.json(payment);
  } else {
    res.status(400).json({ error: 'Payment not completed' });
  }
});

export default router;
