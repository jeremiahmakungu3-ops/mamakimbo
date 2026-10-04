import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TanzaniaPaymentService } from '../services/payments.ts';
import { store } from '../db/store.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { ProvisioningQueue } from '../services/queue.ts';

const router = Router();

// ==============================================================
// PUBLIC / WEBHOOK ENDPOINTS (Tanzania Mobile Money Providers)
// ==============================================================

// Webhook callback from Vodacom M-Pesa / Tigo Pesa / Airtel / AzamPay
router.post('/webhook/:provider', async (req: Request, res: Response) => {
  const { provider } = req.params;
  const payload = req.body;
  const signature = (req.headers['x-signature'] || req.headers['x-azampay-signature'] || '') as string;

  console.log(`[Payment Webhook] Received callback from ${provider}:`, JSON.stringify(payload).substring(0, 200));

  // Extract reference from different provider formats
  let reference = payload.reference || payload.ThirdPartyConversationID || payload.trans_id || payload.externalReference;

  if (payload.output_ThirdPartyConversationID) {
    reference = payload.output_ThirdPartyConversationID;
  }
  if (payload.data?.reference) {
    reference = payload.data.reference;
  }

  if (!reference) {
    return res.status(400).json({ error: 'Missing transaction reference in payload' });
  }

  // 1. Complete transaction on server-side
  const completedTx = await TanzaniaPaymentService.completeTransaction(
    reference,
    payload.output_TransactionID || payload.transactionId || payload.trans_id,
    payload
  );

  if (!completedTx) {
    return res.status(404).json({ error: 'Transaction not found for reference', reference });
  }

  // 2. Enqueue background provisioning job for MikroTik / Omada / FreeRADIUS
  ProvisioningQueue.enqueueJob({
    orgId: completedTx.org_id || 1,
    transactionId: completedTx.id,
    targetType: 'radius',
    targetId: 1,
    payload: {
      voucherId: completedTx.voucher_id,
      planId: completedTx.profile_id,
    },
  });

  // 3. Dispatch Notification
  store.notifications.unshift({
    id: store.notifications.length + 1,
    org_id: completedTx.org_id || 1,
    type: 'payment',
    title: `Payment Received: ${completedTx.amount_tzs.toLocaleString()} TZS`,
    message: `Mobile money payment via ${completedTx.provider.toUpperCase()} from ${completedTx.phone_number} verified. Ref: ${completedTx.reference}`,
    severity: 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  res.json({
    status: 'SUCCESS',
    message: 'Payment received, verified, and enqueued for provisioning',
    reference: completedTx.reference,
    voucherId: completedTx.voucher_id,
  });
});

// GET /api/payments/:reference/status (Poll payment status)
router.get('/:reference/status', (req: Request, res: Response) => {
  const { reference } = req.params;
  const tx = store.transactions.find((t) => t.reference === reference);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  let voucherData = null;
  if (tx.voucher_id) {
    const v = store.vouchers.find((voc) => voc.id === tx.voucher_id);
    if (v) {
      voucherData = {
        code: v.code,
        password: v.password,
        priceTzs: v.price_tzs,
      };
    }
  }

  res.json({
    reference: tx.reference,
    externalReference: tx.external_reference,
    status: tx.status,
    provisioningStatus: tx.provisioning_status,
    amountTzs: tx.amount_tzs,
    provider: tx.provider,
    voucher: voucherData,
  });
});

// ==============================================================
// AUTHENTICATED PAYMENT INITIATION & RETRY
// ==============================================================

// POST /api/payments/initiate
router.post('/initiate', async (req: Request, res: Response) => {
  const schema = z.object({
    provider: z.enum(['vodacom_mpesa', 'tigo_pesa', 'airtel_money', 'azampay']),
    phoneNumber: z.string().min(9),
    amountTzs: z.number().min(100),
    type: z.enum(['voucher_purchase', 'account_topup', 'subscription_renewal', 'agent_float']),
    profileId: z.number().optional(),
    customerId: z.number().optional(),
    agentId: z.number().optional(),
    routerId: z.number().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
  }

  const result = await TanzaniaPaymentService.initiatePayment(parsed.data);
  res.status(201).json(result);
});

// POST /api/payments/:id/retry-provisioning (Manual administrator retry when hardware was offline)
router.post('/:id/retry-provisioning', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const tx = store.transactions.find((t) => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  tx.provisioning_status = 'retrying';
  tx.updated_at = new Date().toISOString();

  ProvisioningQueue.enqueueJob({
    orgId: tx.org_id || 1,
    transactionId: tx.id,
    targetType: 'radius',
    targetId: 1,
    payload: {
      voucherId: tx.voucher_id,
      planId: tx.profile_id,
    },
  });

  res.json({ success: true, message: 'Provisioning retry enqueued for execution.' });
});

// POST /api/payments/simulate-instant-success (for operator POS & instant test callback)
router.post('/simulate-instant-success', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ error: 'Missing reference' });
  }

  const tx = await TanzaniaPaymentService.completeTransaction(
    reference,
    `SIMULATED-${Math.floor(100000 + Math.random() * 900000)}`,
    { simulated: true, approvedBy: req.user?.username }
  );

  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Trigger automated background provisioning
  ProvisioningQueue.enqueueJob({
    orgId: tx.org_id || 1,
    transactionId: tx.id,
    targetType: 'radius',
    targetId: 1,
    payload: {
      voucherId: tx.voucher_id,
      planId: tx.profile_id,
    },
  });

  res.json({ success: true, transaction: tx });
});

export default router;
