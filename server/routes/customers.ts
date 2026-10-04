import { Router, Response } from 'express';
import { z } from 'zod';
import { store, Customer } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/customers
router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const populated = store.customers.map((c) => {
    const profile = store.profiles.find((p) => p.id === c.profile_id);
    return {
      ...c,
      profileName: profile?.name || 'Unassigned',
      rateLimit: profile ? `${profile.rate_limit_rx}/${profile.rate_limit_tx}` : '-',
    };
  });
  res.json(populated);
});

// POST /api/customers
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    username: z.string().min(3),
    fullName: z.string().min(2),
    phone: z.string().min(9),
    email: z.string().email().optional(),
    profileId: z.number().nullable().optional(),
    connectionType: z.enum(['hotspot', 'pppoe', 'static']).default('hotspot'),
    initialBalanceTzs: z.number().default(0),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { username, fullName, phone, email, profileId, connectionType, initialBalanceTzs } = parsed.data;

  if (store.customers.some((c) => c.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Customer username already exists' });
  }

  const newCustomer: Customer = {
    id: store.customers.length + 1,
    org_id: req.user?.org_id || 1,
    username,
    full_name: fullName,
    phone,
    email,
    balance_tzs: initialBalanceTzs,
    profile_id: profileId || null,
    connection_type: connectionType,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  store.customers.unshift(newCustomer);
  res.status(201).json(newCustomer);
});

// PATCH /api/customers/:id/topup
router.patch('/:id/topup', (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const customer = store.customers.find((c) => c.id === id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const amount = parseInt(req.body.amount, 10);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount' });
  }

  customer.balance_tzs += amount;
  res.json(customer);
});

export default router;
