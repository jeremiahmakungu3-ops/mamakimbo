import { Router, Response } from 'express';
import { z } from 'zod';
import { store, Organization } from '../db/store.ts';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/organizations - List all organizations (for superadmin or current user's org)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'superadmin') {
    return res.json(store.organizations);
  }
  const userOrg = store.organizations.filter((o) => o.id === req.user?.org_id);
  res.json(userOrg);
});

// GET /api/organizations/current - Get current organization profile & stats
router.get('/current', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const org = store.organizations.find((o) => o.id === orgId);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const routerCount = store.routers.filter((r) => r.org_id === orgId).length;
  const omadaCount = store.omadaControllers.filter((c) => c.org_id === orgId).length;
  const customerCount = store.customers.filter((c) => c.org_id === orgId).length;
  const voucherCount = store.vouchers.filter((v) => v.org_id === orgId && v.status === 'active').length;

  res.json({
    ...org,
    stats: {
      routers: routerCount,
      controllers: omadaCount,
      customers: customerCount,
      activeVouchers: voucherCount,
    },
  });
});

// POST /api/organizations - Create new tenant organization (Superadmin)
router.post('/', requireRole(['superadmin']), (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    domain: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    currency: z.string().default('TZS'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const { name, slug, domain, contactEmail, contactPhone, currency } = parsed.data;

  if (store.organizations.some((o) => o.slug.toLowerCase() === slug.toLowerCase())) {
    return res.status(409).json({ error: 'Organization slug already exists' });
  }

  const newOrg: Organization = {
    id: store.organizations.length + 1,
    name,
    slug: slug.toLowerCase(),
    domain,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    currency,
    timezone: 'Africa/Dar_es_Salaam',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.organizations.push(newOrg);
  res.status(201).json(newOrg);
});

export default router;
