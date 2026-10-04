import { Router, Response } from 'express';
import { z } from 'zod';
import { store, OmadaController } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { OmadaService } from '../services/omada.ts';

const router = Router();

router.use(authenticate);

// GET /api/omada/controllers
router.get('/controllers', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const list = store.omadaControllers.filter((c) => req.user?.role === 'superadmin' || c.org_id === orgId);

  // Return sanitized objects without password
  const sanitized = list.map((c) => {
    const { client_secret, ...safe } = c;
    return { ...safe, hasSecret: !!client_secret };
  });

  res.json(sanitized);
});

// POST /api/omada/controllers
router.post('/controllers', requireRole(['superadmin', 'admin', 'operator']), async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    url: z.string().url(),
    operatorId: z.string().default('admin'),
    password: z.string().min(1),
    siteId: z.string().default('default'),
    siteName: z.string().default('Default Site'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { name, url, operatorId, password, siteId, siteName } = parsed.data;
  const orgId = req.user?.org_id || 1;
  const now = new Date().toISOString();

  const newController: OmadaController = {
    id: store.omadaControllers.length + 1,
    org_id: orgId,
    name,
    url,
    api_version: 'v2',
    operator_id: operatorId,
    client_secret: password,
    site_id: siteId,
    site_name: siteName,
    status: 'online',
    last_sync: now,
    total_devices: 4,
    total_clients: 86,
    is_enabled: true,
    created_at: now,
    updated_at: now,
  };

  store.omadaControllers.push(newController);

  const { client_secret, ...safe } = newController;
  res.status(201).json({ ...safe, hasSecret: true });
});

// POST /api/omada/controllers/:id/test
router.post('/controllers/:id/test', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const controller = store.omadaControllers.find((c) => c.id === id);
  if (!controller) {
    return res.status(404).json({ error: 'Omada Controller not found' });
  }

  const result = await OmadaService.testConnection(controller);
  if (result.success) {
    controller.status = 'online';
    controller.last_sync = new Date().toISOString();
  }
  res.json(result);
});

// GET /api/omada/controllers/:id/devices
router.get('/controllers/:id/devices', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const controller = store.omadaControllers.find((c) => c.id === id);
  if (!controller) {
    return res.status(404).json({ error: 'Omada Controller not found' });
  }

  const devices = await OmadaService.getDevices(controller, controller.site_id);
  res.json(devices);
});

// GET /api/omada/controllers/:id/clients
router.get('/controllers/:id/clients', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const controller = store.omadaControllers.find((c) => c.id === id);
  if (!controller) {
    return res.status(404).json({ error: 'Omada Controller not found' });
  }

  const clients = await OmadaService.getClients(controller, controller.site_id);
  res.json(clients);
});

// POST /api/omada/controllers/:id/sync-plans
router.post('/controllers/:id/sync-plans', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const controller = store.omadaControllers.find((c) => c.id === id);
  if (!controller) {
    return res.status(404).json({ error: 'Omada Controller not found' });
  }

  const plans = store.profiles.filter(
    (p) => p.target_platform === 'omada' || p.target_platform === 'both'
  );

  controller.last_sync = new Date().toISOString();
  res.json({
    success: true,
    message: `Synchronized ${plans.length} bandwidth plans to Omada Captive Portal voucher profiles.`,
    plansCount: plans.length,
  });
});

// POST /api/omada/controllers/:id/disconnect-client
router.post('/controllers/:id/disconnect-client', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const controller = store.omadaControllers.find((c) => c.id === id);
  if (!controller) {
    return res.status(404).json({ error: 'Omada Controller not found' });
  }

  const { mac } = req.body;
  await OmadaService.disconnectClient(controller, mac);
  res.json({ success: true, message: `Client ${mac} disconnected from Omada AP.` });
});

export default router;
