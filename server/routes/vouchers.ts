import { Router, Response } from 'express';
import { z } from 'zod';
import { store, Voucher } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { RadiusService } from '../services/radius.ts';

const router = Router();

router.use(authenticate);

// GET /api/vouchers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { status, profileId, batchId, search } = req.query;

  let list = [...store.vouchers];

  if (status && typeof status === 'string') {
    list = list.filter((v) => v.status === status);
  }
  if (profileId && typeof profileId === 'string') {
    list = list.filter((v) => v.profile_id === parseInt(profileId, 10));
  }
  if (batchId && typeof batchId === 'string') {
    list = list.filter((v) => v.batch_id === batchId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((v) => v.code.toLowerCase().includes(q) || v.password.includes(q));
  }

  // Populate profile info
  const populated = list.map((v) => {
    const profile = store.profiles.find((p) => p.id === v.profile_id);
    const router = store.routers.find((r) => r.id === v.router_id);
    return {
      ...v,
      profileName: profile?.name || 'Standard Plan',
      rateLimit: profile ? `${profile.rate_limit_rx}/${profile.rate_limit_tx}` : '5M/5M',
      routerName: router?.name || 'All Routers',
    };
  });

  res.json(populated);
});

// POST /api/vouchers/generate
router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    profileId: z.number(),
    routerId: z.number().nullable().optional(),
    agentId: z.number().nullable().optional(),
    quantity: z.number().min(1).max(500),
    prefix: z.string().max(8).optional().default('TZ'),
    codeLength: z.number().min(4).max(10).default(6),
    format: z.enum(['numeric', 'alphanumeric']).default('numeric'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { profileId, routerId, agentId, quantity, prefix, codeLength, format } = parsed.data;
  const profile = store.profiles.find((p) => p.id === profileId);
  if (!profile) {
    return res.status(404).json({ error: 'Hotspot profile not found' });
  }

  const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
  const newVouchers: Voucher[] = [];
  const now = new Date().toISOString();

  const numChars = '0123456789';
  const alphaChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const charPool = format === 'numeric' ? numChars : alphaChars;

  for (let i = 0; i < quantity; i++) {
    let randCode = '';
    for (let c = 0; c < codeLength; c++) {
      randCode += charPool.charAt(Math.floor(Math.random() * charPool.length));
    }
    const fullCode = prefix ? `${prefix.toUpperCase()}-${randCode}` : randCode;

    // Generate 4-digit PIN password
    let pin = '';
    for (let p = 0; p < 4; p++) {
      pin += numChars.charAt(Math.floor(Math.random() * numChars.length));
    }

    const voucher: Voucher = {
      id: store.vouchers.length + 1 + i,
      org_id: (req as any).user?.org_id || 1,
      code: fullCode,
      password: pin,
      profile_id: profile.id,
      router_id: routerId || null,
      controller_id: null,
      agent_id: agentId || null,
      status: 'active',
      price_tzs: profile.price_tzs,
      batch_id: batchId,
      generated_by: req.user?.id || 1,
      activated_at: null,
      expires_at: null,
      mac_address: null,
      created_at: now,
    };

    newVouchers.push(voucher);
    store.vouchers.unshift(voucher);

    // Sync each voucher with FreeRADIUS in real time
    await RadiusService.syncVoucher(voucher, profile);
  }

  res.status(201).json({
    batchId,
    quantity,
    profileName: profile.name,
    priceTzs: profile.price_tzs,
    vouchers: newVouchers,
  });
});

// PATCH /api/vouchers/:id/revoke
router.patch('/:id/revoke', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const voucher = store.vouchers.find((v) => v.id === id);
  if (!voucher) {
    return res.status(404).json({ error: 'Voucher not found' });
  }

  voucher.status = 'revoked';
  // Remove from FreeRADIUS
  store.radcheck = store.radcheck.filter((r) => r.username !== voucher.code);
  store.radreply = store.radreply.filter((r) => r.username !== voucher.code);

  res.json({ message: 'Voucher revoked successfully', voucher });
});

export default router;
