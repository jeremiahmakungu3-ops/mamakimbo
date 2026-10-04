import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, User } from '../db/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'netpulse-super-secret-key-change-in-production-2025';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '24h',
  };
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    options
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = store.users.find((u) => u.id === decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: Array<'superadmin' | 'admin' | 'agent' | 'operator' | 'customer'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` });
    }
    next();
  };
}
