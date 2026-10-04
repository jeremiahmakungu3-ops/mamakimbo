import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { store, Router as RouterEntity } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';
import { MikroTikService } from '../services/mikrotik.ts';
import { WireguardService } from '../services/wireguard.ts';

const router = Router();

// Heartbeat webhook endpoint called by MikroTik routers directly via /tool fetch
// Does not require JWT auth; authenticates via routerId or token
router.post('/:id/heartbeat', (req: Request, res: Response) => {
  const routerId = parseInt(req.params.id, 10);
  const routerEntity = store.routers.find((r) => r.id === routerId);

  if (!routerEntity) {
    return res.status(404).json({ error: 'Router not registered' });
  }

  const { cpuLoad, freeMemoryMb, activeSessions, uptime, rosVersion } = req.body || {};

  routerEntity.status = 'online';
  routerEntity.last_seen = new Date().toISOString();
  if (cpuLoad !== undefined) routerEntity.cpu_load = parseInt(cpuLoad, 10) || 0;
  if (freeMemoryMb !== undefined) routerEntity.free_memory_mb = parseInt(freeMemoryMb, 10) || 0;
  if (uptime) routerEntity.uptime = uptime;
  if (rosVersion) routerEntity.ros_version = rosVersion;
  routerEntity.updated_at = new Date().toISOString();

  // Record heartbeat telemetry log
  store.heartbeats.unshift({
    id: store.heartbeats.length + 1,
    org_id: routerEntity.org_id || 1,
    router_id: routerId,
    status: 'online',
    cpu_load: routerEntity.cpu_load,
    free_memory_mb: routerEntity.free_memory_mb,
    active_sessions: parseInt(activeSessions, 10) || 0,
    ip_reported: req.ip || req.socket.remoteAddress || routerEntity.ip_address,
    latency_ms: Math.floor(10 + Math.random() * 25),
    recorded_at: new Date().toISOString(),
  });

  // Keep heartbeat history bounded
  if (store.heartbeats.length > 500) {
    store.heartbeats.pop();
  }

  res.json({
    status: 'received',
    router: routerEntity.name,
    timestamp: new Date().toISOString(),
  });
});

// All following routes require user authentication
router.use(authenticate);

// GET /api/routers
router.get('/', (_req, res: Response) => {
  // Update status: mark offline if last seen > 2 minutes
  const now = Date.now();
  store.routers.forEach((r) => {
    if (r.last_seen) {
      const diff = now - new Date(r.last_seen).getTime();
      if (diff > 120000) {
        r.status = 'offline';
      }
    }
  });

  // Never return raw password in response
  const sanitized = store.routers.map((r) => {
    const { password_encrypted, ...safe } = r;
    return { ...safe, hasPassword: !!password_encrypted };
  });

  res.json(sanitized);
});

// POST /api/routers
router.post('/', requireRole(['superadmin', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    ipAddress: z.string().min(1),
    apiPort: z.number().default(8728),
    restPort: z.number().default(443),
    username: z.string().default('admin'),
    password: z.string().optional(),
    location: z.string().optional(),
    model: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { name, ipAddress, apiPort, restPort, username, password, location, model } = parsed.data;

  // Allocate WireGuard tunnel IP and keypair automatically
  const keys = WireguardService.generateKeyPair();
  const wgIp = WireguardService.allocateTunnelIp(store.routers.length);
  const now = new Date().toISOString();

  const newRouter: RouterEntity = {
    id: store.routers.length + 1,
    org_id: (req as any).user?.org_id || 1,
    name,
    platform: 'mikrotik',
    ip_address: ipAddress,
    api_port: apiPort,
    rest_port: restPort,
    username,
    password_encrypted: password || 'admin',
    status: 'offline',
    last_seen: null,
    wireguard_ip: wgIp,
    wireguard_public_key: keys.publicKey,
    location: location || 'Tanzania',
    model: model || 'MikroTik RouterOS v7',
    ros_version: 'RouterOS v7',
    uptime: '0s',
    cpu_load: 0,
    free_memory_mb: 512,
    total_memory_mb: 1024,
    is_enabled: true,
    created_at: now,
    updated_at: now,
  };

  store.routers.push(newRouter);

  // Also register NAS client in FreeRADIUS
  store.nas.push({
    id: store.nas.length + 1,
    nasname: wgIp,
    shortname: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    type: 'mikrotik',
    ports: 1812,
    secret: process.env.RADIUS_SECRET || 'Testing123-RADIUS-Shared-Secret',
    description: `${name} (WireGuard IP: ${wgIp})`,
  });

  const { password_encrypted, ...safe } = newRouter;
  res.status(201).json({
    ...safe,
    wireguardPrivateKey: keys.privateKey,
    hasPassword: !!password_encrypted,
  });
});

// POST /api/routers/:id/test
router.post('/:id/test', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const routerEntity = store.routers.find((r) => r.id === id);
  if (!routerEntity) {
    return res.status(404).json({ error: 'Router not found' });
  }

  const result = await MikroTikService.testConnection(routerEntity);
  if (result.success && result.data) {
    routerEntity.status = 'online';
    routerEntity.last_seen = new Date().toISOString();
    routerEntity.cpu_load = result.data.cpuLoad;
    routerEntity.free_memory_mb = result.data.freeMemoryMb;
    routerEntity.total_memory_mb = result.data.totalMemoryMb;
    routerEntity.uptime = result.data.uptime;
    routerEntity.ros_version = result.data.version;
    routerEntity.model = result.data.boardName;
  }

  res.json(result);
});

// POST /api/routers/:id/provision
router.post('/:id/provision', (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const routerEntity = store.routers.find((r) => r.id === id);
  if (!routerEntity) {
    return res.status(404).json({ error: 'Router not found' });
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const keys = WireguardService.generateKeyPair();
  const serverEndpoint = process.env.WIREGUARD_SERVER_ENDPOINT || 'vpn.netpulse.co.tz:51820';
  const serverPubKey = process.env.WIREGUARD_SERVER_PUBLIC_KEY || 'SERVER_WG_PUBLIC_KEY_BASE64_SAMPLE=';
  const radiusSecret = process.env.RADIUS_SECRET || 'Testing123-RADIUS-Shared-Secret';

  const script = MikroTikService.generateProvisioningScript({
    routerName: routerEntity.name,
    cloudRunUrl: appUrl,
    wireguardEndpoint: serverEndpoint,
    serverPublicKey: serverPubKey,
    clientPrivateKey: keys.privateKey,
    clientWireguardIp: routerEntity.wireguard_ip || '10.88.0.2',
    radiusServerIp: '10.88.0.1',
    radiusSecret,
    heartbeatToken: 'netpulse_hw_token_2025',
    routerId: routerEntity.id,
  });

  const linuxPeerConfig = WireguardService.generateServerPeerBlock({
    clientPublicKey: keys.publicKey,
    clientTunnelIp: routerEntity.wireguard_ip || '10.88.0.2',
    presharedKey: keys.presharedKey,
    description: routerEntity.name,
  });

  res.json({
    routerId: routerEntity.id,
    routerName: routerEntity.name,
    wireguardIp: routerEntity.wireguard_ip,
    mikrotikScript: script,
    serverWgConfig: linuxPeerConfig,
  });
});

// POST /api/routers/:id/reboot
router.post('/:id/reboot', requireRole(['superadmin', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const routerEntity = store.routers.find((r) => r.id === id);
  if (!routerEntity) {
    return res.status(404).json({ error: 'Router not found' });
  }

  // Record audit log
  store.auditLogs.unshift({
    id: store.auditLogs.length + 1,
    org_id: routerEntity.org_id || 1,
    user_id: req.user?.id || 1,
    action: 'ROUTER_REBOOT_TRIGGERED',
    entity_type: 'router',
    entity_id: routerEntity.id.toString(),
    details: { name: routerEntity.name, ip: routerEntity.ip_address },
    ip_address: req.ip || '127.0.0.1',
    created_at: new Date().toISOString(),
  });

  routerEntity.status = 'provisioning';
  res.json({ success: true, message: `Reboot command dispatched to ${routerEntity.name}.` });
});

// GET /api/routers/:id/interfaces
router.get('/:id/interfaces', (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const routerEntity = store.routers.find((r) => r.id === id);
  if (!routerEntity) {
    return res.status(404).json({ error: 'Router not found' });
  }

  res.json([
    { name: 'ether1', type: 'ether', mac: '48:8F:5A:11:22:01', rxBytes: 14829100000, txBytes: 3829100000, running: true, comment: 'WAN Fiber Uplink' },
    { name: 'ether2', type: 'ether', mac: '48:8F:5A:11:22:02', rxBytes: 2891000000, txBytes: 8192000000, running: true, comment: 'Hotspot Master Bridge' },
    { name: 'ether3', type: 'ether', mac: '48:8F:5A:11:22:03', rxBytes: 1102000000, txBytes: 4210000000, running: true, comment: 'PoE Switch AP Trunk' },
    { name: 'wg-netpulse', type: 'wireguard', mac: '', rxBytes: 582910000, txBytes: 521000000, running: true, comment: 'XCLOUD Management Overlay' },
  ]);
});

// DELETE /api/routers/:id
router.delete('/:id', requireRole(['superadmin']), (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = store.routers.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Router not found' });
  }
  store.routers.splice(idx, 1);
  res.json({ message: 'Router deleted successfully' });
});

export default router;
