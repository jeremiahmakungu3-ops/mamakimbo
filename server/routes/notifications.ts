import { Router, Response } from 'express';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const list = store.notifications.filter((n) => req.user?.role === 'superadmin' || n.org_id === orgId);
  res.json(list);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const notif = store.notifications.find((n) => n.id === id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  notif.is_read = true;
  res.json(notif);
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  store.notifications.forEach((n) => {
    if (req.user?.role === 'superadmin' || n.org_id === orgId) {
      n.is_read = true;
    }
  });
  res.json({ success: true });
});

export default router;
