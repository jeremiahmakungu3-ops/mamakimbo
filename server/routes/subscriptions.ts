import { Router, Response } from 'express';
import { z } from 'zod';
import { store, Subscription } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { ProvisioningQueue } from '../services/queue.ts';

const router = Router();

router.use(authenticate);

// GET /api/subscriptions
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const list = store.subscriptions.filter((s) => req.user?.role === 'superadmin' || s.org_id === orgId);

  const populated = list.map((s) => {
    const customer = store.customers.find((c) => c.id === s.customer_id);
    const plan = store.profiles.find((p) => p.id === s.profile_id);
    const routerItem = store.routers.find((r) => r.id === s.router_id);
    return {
      ...s,
      customerName: customer?.full_name || 'Subscriber',
      customerPhone: customer?.phone || '-',
      planName: plan?.name || 'Standard Plan',
      rateLimit: plan ? `${plan.rate_limit_rx}/${plan.rate_limit_tx}` : '10M/10M',
      routerName: routerItem?.name || 'All Gateways',
    };
  });

  res.json(populated);
});

// POST /api/subscriptions
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    customerId: z.number(),
    profileId: z.number(),
    routerId: z.number().nullable().optional(),
    durationDays: z.number().default(30),
    autoRenew: z.boolean().default(true),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { customerId, profileId, routerId, durationDays, autoRenew } = parsed.data;
  const orgId = req.user?.org_id || 1;
  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 86400000);

  const sub: Subscription = {
    id: store.subscriptions.length + 1,
    org_id: orgId,
    customer_id: customerId,
    profile_id: profileId,
    router_id: routerId || null,
    controller_id: null,
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    auto_renew: autoRenew,
    status: 'active',
    last_provisioned_at: now.toISOString(),
    created_at: now.toISOString(),
  };

  store.subscriptions.unshift(sub);
  res.status(201).json(sub);
});

// POST /api/subscriptions/:id/retry-provision
router.post('/:id/retry-provision', async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const sub = store.subscriptions.find((s) => s.id === id);
  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  sub.status = 'active';
  sub.last_provisioned_at = new Date().toISOString();

  // Enqueue background provisioning job
  ProvisioningQueue.enqueueJob({
    orgId: sub.org_id,
    targetType: 'mikrotik',
    targetId: sub.router_id || 1,
    payload: { subscriptionId: sub.id, customerId: sub.customer_id, planId: sub.profile_id },
  });

  res.json({ success: true, message: 'Subscription provisioning job enqueued.', subscription: sub });
});

export default router;
