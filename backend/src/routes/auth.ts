import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { storeId: user.storeId, email: user.email, role: user.role },
      config.jwtSecret,
      { subject: user.id, expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        requirePasswordReset: user.requirePasswordReset
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      requirePasswordReset: user.requirePasswordReset
    });
  } catch (error) {
    next(error);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6)
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.requirePasswordReset) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Contraseña actual requerida' });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Contraseña actual inválida' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, requirePasswordReset: false }
    });

    return res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    next(error);
  }
});

export default router;
