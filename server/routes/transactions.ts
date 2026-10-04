import { Router, Response } from 'express';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/transactions
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { provider, status, search } = req.query;

  let list = [...store.transactions];

  if (provider && typeof provider === 'string') {
    list = list.filter((t) => t.provider === provider);
  }
  if (status && typeof status === 'string') {
    list = list.filter((t) => t.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((t) => t.reference.toLowerCase().includes(q) || t.phone_number.includes(q));
  }

  res.json(list);
});

// GET /api/transactions/stats
router.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  const completed = store.transactions.filter((t) => t.status === 'completed');
  const totalVolumeTzs = completed.reduce((sum, t) => sum + t.amount_tzs, 0);
  const totalFeesTzs = completed.reduce((sum, t) => sum + t.fee_tzs, 0);

  const byProvider: Record<string, { count: number; volumeTzs: number }> = {};
  completed.forEach((t) => {
    if (!byProvider[t.provider]) {
      byProvider[t.provider] = { count: 0, volumeTzs: 0 };
    }
    byProvider[t.provider].count++;
    byProvider[t.provider].volumeTzs += t.amount_tzs;
  });

  res.json({
    totalCompletedCount: completed.length,
    totalVolumeTzs,
    totalFeesTzs,
    byProvider,
  });
});

export default router;
