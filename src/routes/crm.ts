import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get CRM contacts
router.get('/contacts', verifyToken, async (req: AuthRequest, res) => {
  const contacts = await prisma.crmContact.findMany({
    where: { professional: { userId: req.userId! } },
    include: { notes: true },
  });

  res.json(contacts);
});

// Add CRM note
router.post('/notes', verifyToken, async (req: AuthRequest, res) => {
  const { contactId, content } = req.body;

  const note = await prisma.cRMNote.create({
    data: {
      contactId,
      userId: req.userId!,
      content,
    },
  });

  res.json(note);
});

export default router;
