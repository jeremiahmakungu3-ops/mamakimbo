import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { store, User } from '../db/store.ts';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'agent', 'operator', 'customer']).optional(),
  phone: z.string().optional(),
});

function sanitizeUser(user: User) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { username, password } = parsed.data;
  const user = store.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
  );

  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { username, email, password, fullName, role = 'operator', phone } = parsed.data;

  if (store.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: store.users.length + 1,
    org_id: 1,
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

  store.users.push(newUser);
  const token = generateToken(newUser);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: sanitizeUser(req.user) });
});

export default router;
