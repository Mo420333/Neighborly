import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all professionals with filters
router.get('/', async (req, res) => {
  const { category, city, page = 1, limit = 20, search } = req.query;

  const where: any = { verified: true };
  if (category) where.category = category;
  if (city) where.city = city;
  if (search) {
    where.OR = [
      { businessName: { contains: search as string, mode: 'insensitive' } },
      { bio: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const professionals = await prisma.professional.findMany({
    where,
    include: { user: true },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { averageRating: 'desc' },
  });

  const total = await prisma.professional.count({ where });

  res.json({
    data: professionals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// Get professional by ID
router.get('/:id', async (req, res) => {
  const professional = await prisma.professional.findUnique({
    where: { id: req.params.id },
    include: {
      user: true,
      reviews: {
        include: { customer: { select: { firstName: true, lastName: true } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  res.json(professional);
});

// Create/Update professional profile
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  const {
    businessName,
    category,
    address,
    city,
    state,
    zipCode,
    bio,
    basePrice,
  } = req.body;

  const professional = await prisma.professional.upsert({
    where: { userId: req.userId! },
    create: {
      userId: req.userId!,
      businessName,
      category,
      address,
      city,
      state,
      zipCode,
      bio,
      basePrice,
    },
    update: {
      businessName,
      category,
      address,
      city,
      state,
      zipCode,
      bio,
      basePrice,
    },
  });

  res.json(professional);
});

export default router;
