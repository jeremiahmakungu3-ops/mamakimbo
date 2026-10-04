import { Router, Response } from 'express';
import { z } from 'zod';
import { store, Agent } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/agents
router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const populated = store.agents.map((a) => {
    const user = store.users.find((u) => u.id === a.user_id);
    const vouchersIssued = store.vouchers.filter((v) => v.agent_id === a.id);
    const vouchersSold = vouchersIssued.filter((v) => v.status === 'used');
    const totalSoldTzs = vouchersSold.reduce((sum, v) => sum + v.price_tzs, 0);
    const commissionEarnedTzs = Math.round(totalSoldTzs * (a.commission_percent / 100));

    return {
      ...a,
      username: user?.username || 'unknown',
      fullName: user?.full_name || a.business_name,
      vouchersIssuedCount: vouchersIssued.length,
      vouchersSoldCount: vouchersSold.length,
      totalSoldTzs,
      commissionEarnedTzs,
    };
  });
  res.json(populated);
});

// POST /api/agents
router.post('/', requireRole(['superadmin', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    userId: z.number(),
    businessName: z.string().min(2),
    phone: z.string().min(9),
    floatBalanceTzs: z.number().default(0),
    commissionPercent: z.number().default(10.0),
    location: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { userId, businessName, phone, floatBalanceTzs, commissionPercent, location } = parsed.data;

  const newAgent: Agent = {
    id: store.agents.length + 1,
    org_id: req.user?.org_id || 1,
    user_id: userId,
    business_name: businessName,
    phone,
    float_balance_tzs: floatBalanceTzs,
    commission_percent: commissionPercent,
    location,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  store.agents.push(newAgent);
  res.status(201).json(newAgent);
});

// POST /api/agents/:id/topup-float
router.post('/:id/topup-float', requireRole(['superadmin', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const agent = store.agents.find((a) => a.id === id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const amount = parseInt(req.body.amount, 10);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid float amount' });
  }

  agent.float_balance_tzs += amount;
  res.json({ message: 'Agent float credited', agent });
});

export default router;
