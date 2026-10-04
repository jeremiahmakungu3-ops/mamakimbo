import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { store, User } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

function sanitizeUser(user: User) {
  const { password_hash, ...safe } = user;
  return safe;
}

// GET /api/users
router.get('/', requireRole(['superadmin', 'admin']), (_req, res: Response) => {
  res.json(store.users.map(sanitizeUser));
});

// POST /api/users
router.post('/', requireRole(['superadmin', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['superadmin', 'admin', 'agent', 'operator', 'customer']),
    phone: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { username, email, password, fullName, role, phone } = parsed.data;

  if (store.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already in use' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const now = new Date().toISOString();

  const user: User = {
    id: store.users.length + 1,
    org_id: req.user?.org_id || 1,
    username,
    email,
    password_hash: passwordHash,
    full_name: fullName,
    role,
    phone,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  store.users.push(user);
  res.status(201).json(sanitizeUser(user));
});

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', requireRole(['superadmin', 'admin']), (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = store.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.is_active = !user.is_active;
  user.updated_at = new Date().toISOString();
  res.json(sanitizeUser(user));
});

// DELETE /api/users/:id
router.delete('/:id', requireRole(['superadmin']), (req, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  store.users.splice(idx, 1);
  res.json({ message: 'User deleted successfully' });
});

export default router;
