import { Router, Request, Response } from 'express';
import { RadiusService } from '../services/radius.ts';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// ==============================================================
// FreeRADIUS rlm_rest Module Endpoints (Called by FreeRADIUS Daemon)
// ==============================================================

// POST /api/radius/authorize
router.post('/authorize', (req: Request, res: Response) => {
  const result = RadiusService.handleAuthorize(req.body);
  if (!result.authorized) {
    return res.status(401).json({ error: result.error || 'Access-Reject' });
  }

  // FreeRADIUS rlm_rest expects JSON or attribute key-value pairs
  res.json({
    'control:Auth-Type': 'Accept',
    ...result.reply,
  });
});

// POST /api/radius/authenticate
router.post('/authenticate', (req: Request, res: Response) => {
  const { 'User-Name': username, 'User-Password': password } = req.body;
  const voucher = store.vouchers.find((v) => v.code === username && v.password === password && v.status === 'active');

  if (voucher) {
    return res.status(200).json({ status: 'Access-Accept' });
  }

  res.status(401).json({ status: 'Access-Reject' });
});

// POST /api/radius/accounting
router.post('/accounting', (req: Request, res: Response) => {
  RadiusService.handleAccounting(req.body);
  res.json({ status: 'Accounting-Response' });
});

// ==============================================================
// Admin RADIUS Management & Inspection Endpoints
// ==============================================================

router.use(authenticate);

// GET /api/radius/status
router.get('/status', (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    enabled: true,
    radcheckCount: store.radcheck.length,
    radreplyCount: store.radreply.length,
    activeSessionsCount: store.radacct.filter((a) => !a.acctstoptime).length,
    nasCount: store.nas.length,
    secretConfigured: !!process.env.RADIUS_SECRET,
  });
});

// GET /api/radius/radcheck
router.get('/radcheck', (_req: AuthenticatedRequest, res: Response) => {
  res.json(store.radcheck);
});

// GET /api/radius/radreply
router.get('/radreply', (_req: AuthenticatedRequest, res: Response) => {
  res.json(store.radreply);
});

// GET /api/radius/radacct
router.get('/radacct', (_req: AuthenticatedRequest, res: Response) => {
  res.json(store.radacct);
});

// GET /api/radius/nas
router.get('/nas', (_req: AuthenticatedRequest, res: Response) => {
  res.json(store.nas);
});

// POST /api/radius/sync-all
router.post('/sync-all', async (_req: AuthenticatedRequest, res: Response) => {
  store.radcheck = [];
  store.radreply = [];

  for (const v of store.vouchers) {
    if (v.status === 'active') {
      const profile = store.profiles.find((p) => p.id === v.profile_id);
      await RadiusService.syncVoucher(v, profile);
    }
  }

  res.json({
    success: true,
    message: `Synchronized ${store.radcheck.length} check rules and ${store.radreply.length} reply rules with FreeRADIUS.`,
  });
});

export default router;
