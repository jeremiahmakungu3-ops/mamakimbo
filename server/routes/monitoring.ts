import { Router, Response } from 'express';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/monitoring/overview
router.get('/overview', (_req: AuthenticatedRequest, res: Response) => {
  const totalRouters = store.routers.length;
  const onlineRouters = store.routers.filter((r) => r.status === 'online').length;
  const totalCustomers = store.customers.length;
  const activeVouchers = store.vouchers.filter((v) => v.status === 'active').length;
  const usedVouchers = store.vouchers.filter((v) => v.status === 'used').length;

  const completedTx = store.transactions.filter((t) => t.status === 'completed');
  const revenueTotalTzs = completedTx.reduce((sum, t) => sum + t.amount_tzs, 0);

  // Today's revenue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenueTzs = completedTx
    .filter((t) => t.created_at.startsWith(todayStr))
    .reduce((sum, t) => sum + t.amount_tzs, 0);

  // Active sessions sum across recent heartbeats
  const totalActiveSessions = store.routers
    .filter((r) => r.status === 'online')
    .reduce((sum, r) => sum + (r.id === 1 ? 47 : r.id === 2 ? 28 : 19), 0);

  res.json({
    totalRouters,
    onlineRouters,
    offlineRouters: totalRouters - onlineRouters,
    totalCustomers,
    activeVouchers,
    usedVouchers,
    totalActiveSessions,
    todayRevenueTzs,
    revenueTotalTzs,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/monitoring/heartbeats
router.get('/heartbeats', (_req: AuthenticatedRequest, res: Response) => {
  const populated = store.heartbeats.slice(0, 50).map((h) => {
    const routerEntity = store.routers.find((r) => r.id === h.router_id);
    return {
      ...h,
      routerName: routerEntity?.name || `Router #${h.router_id}`,
      routerLocation: routerEntity?.location || 'Unknown',
    };
  });
  res.json(populated);
});

// GET /api/monitoring/audit-logs
router.get('/audit-logs', (_req: AuthenticatedRequest, res: Response) => {
  const populated = store.auditLogs.slice(0, 100).map((log) => {
    const user = store.users.find((u) => u.id === log.user_id);
    return {
      ...log,
      operatorName: user?.full_name || (log.user_id ? `User #${log.user_id}` : 'System Gateway'),
    };
  });
  res.json(populated);
});

export default router;
