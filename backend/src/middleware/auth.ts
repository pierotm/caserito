import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      storeId: string;
      email: string;
      role: string;
    };

    req.auth = {
      userId: payload.sub,
      storeId: payload.storeId,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
