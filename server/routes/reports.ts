import { Router, Response } from 'express';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// GET /api/reports/financial
router.get('/financial', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const completed = store.transactions.filter(
    (t) => (req.user?.role === 'superadmin' || t.org_id === orgId) && t.status === 'completed'
  );

  const totalGrossTzs = completed.reduce((s, t) => s + t.amount_tzs, 0);
  const totalFeesTzs = completed.reduce((s, t) => s + t.fee_tzs, 0);
  const netRevenueTzs = totalGrossTzs - totalFeesTzs;

  const byProvider: Record<string, { count: number; volume: number; fees: number }> = {};
  completed.forEach((t) => {
    if (!byProvider[t.provider]) {
      byProvider[t.provider] = { count: 0, volume: 0, fees: 0 };
    }
    byProvider[t.provider].count++;
    byProvider[t.provider].volume += t.amount_tzs;
    byProvider[t.provider].fees += t.fee_tzs;
  });

  res.json({
    totalGrossTzs,
    totalFeesTzs,
    netRevenueTzs,
    totalTransactions: completed.length,
    byProvider,
  });
});

// GET /api/reports/vouchers
router.get('/vouchers', (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user?.org_id || 1;
  const orgVouchers = store.vouchers.filter(
    (v) => req.user?.role === 'superadmin' || v.org_id === orgId
  );

  const totalGenerated = orgVouchers.length;
  const activeCount = orgVouchers.filter((v) => v.status === 'active').length;
  const usedCount = orgVouchers.filter((v) => v.status === 'used').length;
  const expiredCount = orgVouchers.filter((v) => v.status === 'expired').length;
  const totalValueTzs = orgVouchers.reduce((s, v) => s + v.price_tzs, 0);
  const redeemedValueTzs = orgVouchers.filter((v) => v.status === 'used').reduce((s, v) => s + v.price_tzs, 0);

  res.json({
    totalGenerated,
    activeCount,
    usedCount,
    expiredCount,
    totalValueTzs,
    redeemedValueTzs,
    conversionRatePercent: totalGenerated > 0 ? Math.round((usedCount / totalGenerated) * 100) : 0,
  });
});

export default router;
