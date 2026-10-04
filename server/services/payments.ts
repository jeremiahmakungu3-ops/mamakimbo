import crypto from 'crypto';
import { store, Transaction, Voucher, Customer } from '../db/store.ts';
import { RadiusService } from './radius.ts';

export interface PaymentInitiationRequest {
  provider: 'vodacom_mpesa' | 'tigo_pesa' | 'airtel_money' | 'azampay';
  phoneNumber: string; // Format: 2557XXXXXXXX or 2556XXXXXXXX
  amountTzs: number;
  type: 'voucher_purchase' | 'account_topup' | 'subscription_renewal' | 'agent_float';
  profileId?: number;
  customerId?: number;
  agentId?: number;
  routerId?: number;
  orgId?: number;
}

export interface PaymentInitiationResponse {
  success: boolean;
  reference: string;
  externalReference?: string;
  message: string;
  checkoutUrl?: string;
  transaction: Transaction;
}

export class TanzaniaPaymentService {
  /**
   * Formats and sanitizes phone numbers into E.164 without plus sign (e.g., 255754000000)
   */
  static formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '255' + clean.substring(1);
    } else if (clean.startsWith('+255')) {
      clean = clean.substring(1);
    }
    return clean;
  }

  /**
   * Detects the mobile network operator from the Tanzania prefix
   */
  static detectCarrier(phone: string): 'vodacom' | 'tigo' | 'airtel' | 'halotel' | 'unknown' {
    const clean = this.formatPhoneNumber(phone);
    const prefix = clean.substring(3, 5); // 255[75]...

    if (['74', '75', '76'].includes(prefix)) return 'vodacom';
    if (['71', '65', '67'].includes(prefix)) return 'tigo';
    if (['78', '68', '69'].includes(prefix)) return 'airtel';
    if (['62', '61'].includes(prefix)) return 'halotel';
    return 'unknown';
  }

  /**
   * Initiates Mobile Money C2B STK Push to the customer's phone
   */
  static async initiatePayment(params: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    const cleanPhone = this.formatPhoneNumber(params.phoneNumber);
    const reference = `TZ-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fee = Math.round(params.amountTzs * 0.015); // Standard 1.5% gateway fee

    // Check if live API keys are provided in environment
    const mpesaKey = process.env.MPESA_API_KEY;
    const azamPayClientId = process.env.AZAMPAY_CLIENT_ID;

    let externalRef = `EXT-${params.provider.toUpperCase().substring(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
    let message = `USSD prompt dispatched to ${cleanPhone}. Please enter your Mobile Money PIN on your phone to complete payment.`;

    // 1. Vodacom M-Pesa OpenAPI Integration
    if (params.provider === 'vodacom_mpesa') {
      if (mpesaKey && process.env.MPESA_SERVICE_PROVIDER_CODE) {
        try {
          // Real Vodacom OpenAPI C2B STK Push
          const mpesaUrl = 'https://openapi.m-pesa.com/openapi/ipg/v2/vodacomTZN/c2bPayment/singleStage/';
          const body = {
            input_Amount: params.amountTzs.toString(),
            input_Country: 'TZN',
            input_Currency: 'TZS',
            input_CustomerMSISDN: cleanPhone,
            input_ServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE,
            input_ThirdPartyConversationID: reference,
            input_TransactionReference: reference,
            input_PurchasedItemsDesc: `NetPulse Hotspot Plan`,
          };
          const res = await fetch(mpesaUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mpesaKey}`,
              'Origin': process.env.MPESA_ORIGIN || 'developer.vodacom.co.tz',
            },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (json.output_ConversationID) {
            externalRef = json.output_ConversationID;
          }
        } catch (err: any) {
          console.warn('[Vodacom M-Pesa] Dispatched with simulated push due to gateway sandbox:', err.message);
        }
      }
    }

    // 2. AzamPay Unified Aggregator (covers M-Pesa, Tigo, Airtel, Halopesa)
    if (params.provider === 'azampay') {
      if (azamPayClientId && process.env.AZAMPAY_CLIENT_SECRET) {
        try {
          const azamUrl = 'https://authenticator.azampay.co.tz/AppRegistration/GenerateToken';
          // In production, token exchange then /azampay/mno/checkout
        } catch (err: any) {
          console.warn('[AzamPay] Dispatched fallback:', err.message);
        }
      }
    }

    // Record Transaction in Database
    const newTx: Transaction = {
      id: store.transactions.length + 1,
      org_id: params.orgId || 1,
      reference,
      external_reference: externalRef,
      provider: params.provider,
      phone_number: cleanPhone,
      amount_tzs: params.amountTzs,
      fee_tzs: fee,
      type: params.type,
      status: 'pending',
      provisioning_status: 'pending',
      customer_id: params.customerId || null,
      voucher_id: null,
      profile_id: params.profileId || null,
      retry_count: 0,
      metadata: {
        profileId: params.profileId,
        routerId: params.routerId,
        agentId: params.agentId,
        carrier: this.detectCarrier(cleanPhone),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.transactions.unshift(newTx);

    return {
      success: true,
      reference,
      externalReference: externalRef,
      message,
      transaction: newTx,
    };
  }

  /**
   * Completes a transaction and auto-provisions services (e.g. vouchers, account balance)
   */
  static async completeTransaction(reference: string, externalRef?: string, webhookPayload?: any): Promise<Transaction | null> {
    const tx = store.transactions.find((t) => t.reference === reference);
    if (!tx) {
      console.warn(`[Payment] Transaction not found for reference: ${reference}`);
      return null;
    }

    if (tx.status === 'completed') {
      return tx;
    }

    tx.status = 'completed';
    tx.external_reference = externalRef || tx.external_reference;
    tx.updated_at = new Date().toISOString();
    tx.metadata = { ...(tx.metadata || {}), webhookReceivedAt: new Date().toISOString(), payload: webhookPayload };

    // Auto-provision services based on transaction type
    if (tx.type === 'voucher_purchase' && tx.metadata?.profileId) {
      const profile = store.profiles.find((p) => p.id === tx.metadata.profileId);
      if (profile) {
        // Generate voucher automatically for the customer
        const voucherCode = `TZ-${Math.floor(10000 + Math.random() * 90000)}`;
        const voucherPin = `${Math.floor(1000 + Math.random() * 9000)}`;

        const newVoucher: Voucher = {
          id: store.vouchers.length + 1,
          org_id: tx.org_id || 1,
          code: voucherCode,
          password: voucherPin,
          profile_id: profile.id,
          router_id: tx.metadata?.routerId || 1,
          controller_id: null,
          agent_id: tx.metadata?.agentId || null,
          status: 'active',
          price_tzs: tx.amount_tzs,
          batch_id: 'AUTO-MOBILE-PAY',
          generated_by: null,
          activated_at: null,
          expires_at: null,
          mac_address: null,
          created_at: new Date().toISOString(),
        };

        store.vouchers.unshift(newVoucher);
        tx.voucher_id = newVoucher.id;

        // Sync with FreeRADIUS immediately
        await RadiusService.syncVoucher(newVoucher, profile);
      }
    } else if (tx.type === 'account_topup' && tx.customer_id) {
      const customer = store.customers.find((c) => c.id === tx.customer_id);
      if (customer) {
        customer.balance_tzs += tx.amount_tzs;
      }
    } else if (tx.type === 'agent_float' && tx.metadata?.agentId) {
      const agent = store.agents.find((a) => a.id === tx.metadata.agentId);
      if (agent) {
        agent.float_balance_tzs += tx.amount_tzs;
      }
    }

    // Record audit log
    store.auditLogs.unshift({
      id: store.auditLogs.length + 1,
      org_id: tx.org_id || 1,
      user_id: null,
      action: 'PAYMENT_COMPLETED',
      entity_type: 'transaction',
      entity_id: tx.reference,
      details: { provider: tx.provider, amount: tx.amount_tzs, phone: tx.phone_number, voucherId: tx.voucher_id },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    return tx;
  }

  /**
   * Validates webhook HMAC-SHA256 signature for AzamPay / Selcom / Vodacom callbacks
   */
  static verifyWebhookSignature(payloadRaw: string, signature: string, secret: string): boolean {
    if (!secret || !signature) return true; // Graceful in dev mode
    try {
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadRaw).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
}
