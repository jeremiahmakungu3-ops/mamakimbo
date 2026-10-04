import { Router, Response } from 'express';
import { z } from 'zod';
import { store, HotspotProfile } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { MikroTikService } from '../services/mikrotik.ts';

const router = Router();

router.use(authenticate);

// GET /api/hotspot/profiles
router.get('/profiles', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const list = store.profiles.filter((p) => req.user?.role === 'superadmin' || p.org_id === orgId);
  res.json(list);
});

// POST /api/hotspot/profiles
router.post('/profiles', requireRole(['superadmin', 'admin', 'operator']), (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    targetPlatform: z.enum(['mikrotik', 'omada', 'both']).default('both'),
    rateLimitRx: z.string().default('5M'),
    rateLimitTx: z.string().default('5M'),
    dataLimitMb: z.number().default(0),
    sharedUsers: z.number().default(1),
    sessionTimeoutMin: z.number().default(60),
    validityDays: z.number().default(1),
    priceTzs: z.number().min(100),
    description: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { name, targetPlatform, rateLimitRx, rateLimitTx, dataLimitMb, sharedUsers, sessionTimeoutMin, validityDays, priceTzs, description } = parsed.data;
  const orgId = req.user?.org_id || 1;

  const newProfile: HotspotProfile = {
    id: store.profiles.length + 1,
    org_id: orgId,
    name,
    target_platform: targetPlatform,
    rate_limit_rx: rateLimitRx,
    rate_limit_tx: rateLimitTx,
    data_limit_mb: dataLimitMb,
    shared_users: sharedUsers,
    session_timeout_min: sessionTimeoutMin,
    validity_days: validityDays,
    price_tzs: priceTzs,
    description,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.profiles.push(newProfile);
  res.status(201).json(newProfile);
});

// DELETE /api/hotspot/profiles/:id
router.delete('/profiles/:id', requireRole(['superadmin', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = store.profiles.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  store.profiles.splice(idx, 1);
  res.json({ message: 'Plan deleted successfully' });
});

// GET /api/hotspot/active-sessions
router.get('/active-sessions', async (req: AuthenticatedRequest, res: Response) => {
  const routerId = req.query.routerId ? parseInt(req.query.routerId as string, 10) : undefined;
  const targetRouter = routerId ? store.routers.find((r) => r.id === routerId) : store.routers[0];

  if (!targetRouter) {
    return res.json([]);
  }

  const sessions = await MikroTikService.getActiveSessions(targetRouter);
  res.json(sessions);
});

// POST /api/hotspot/active-sessions/:sessionId/disconnect
router.post('/active-sessions/:sessionId/disconnect', async (req: AuthenticatedRequest, res: Response) => {
  const routerId = req.query.routerId ? parseInt(req.query.routerId as string, 10) : 1;
  const targetRouter = store.routers.find((r) => r.id === routerId) || store.routers[0];

  if (targetRouter) {
    await MikroTikService.disconnectSession(targetRouter, req.params.sessionId);
  }

  res.json({ success: true, message: `Session ${req.params.sessionId} terminated.` });
});

export default router;
