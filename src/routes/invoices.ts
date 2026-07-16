import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create invoice
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  const { bookingId, amount, tax, discount } = req.body;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}`,
      bookingId,
      customerId: req.userId!,
      professionalId: req.body.professionalId,
      amount,
      tax: tax || 0,
      discount: discount || 0,
      total: amount + (tax || 0) - (discount || 0),
      status: 'DRAFT',
    },
  });

  res.status(201).json(invoice);
});

// Get invoices
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { customerId: req.userId! },
        { professionalId: req.userId! },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invoices);
});

export default router;
