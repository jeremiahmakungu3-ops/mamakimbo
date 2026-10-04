import { store, ProvisioningJob, Transaction, Voucher, Customer } from '../db/store.ts';
import { MikroTikService } from './mikrotik.ts';
import { OmadaService } from './omada.ts';
import { RadiusService } from './radius.ts';

export class ProvisioningQueue {
  private static isRunning = false;
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Initializes background worker queue for automated plan & voucher provisioning
   */
  static startWorker(intervalMs: number = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Queue] Provisioning Background Worker started (interval: 5s)...');

    this.timer = setInterval(async () => {
      await this.processPendingJobs();
    }, intervalMs);
  }

  static stopWorker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Enqueues a new provisioning job following verified server-side payment
   */
  static enqueueJob(params: {
    orgId: number;
    transactionId?: number;
    targetType: 'mikrotik' | 'omada' | 'radius';
    targetId: number;
    payload: any;
  }): ProvisioningJob {
    const job: ProvisioningJob = {
      id: store.provisioningJobs.length + 1,
      org_id: params.orgId,
      transaction_id: params.transactionId || null,
      target_type: params.targetType,
      target_id: params.targetId,
      payload: params.payload,
      status: 'pending',
      attempts: 0,
      max_attempts: 5,
      error_message: null,
      last_attempt_at: null,
      created_at: new Date().toISOString(),
    };

    store.provisioningJobs.unshift(job);
    return job;
  }

  /**
   * Processes all pending and retrying provisioning jobs
   */
  static async processPendingJobs() {
    const pendingJobs = store.provisioningJobs.filter(
      (j) => j.status === 'pending' || (j.status === 'failed' && j.attempts < j.max_attempts)
    );

    for (const job of pendingJobs) {
      job.attempts++;
      job.last_attempt_at = new Date().toISOString();

      try {
        await this.executeJob(job);
        job.status = 'completed';
        job.error_message = null;

        // If linked to transaction, update provisioning_status
        if (job.transaction_id) {
          const tx = store.transactions.find((t) => t.id === job.transaction_id);
          if (tx) {
            tx.provisioning_status = 'provisioned';
            tx.updated_at = new Date().toISOString();
          }
        }
      } catch (err: any) {
        job.error_message = err.message || 'Provisioning error';
        if (job.attempts >= job.max_attempts) {
          job.status = 'failed';

          // Mark transaction as provisioning_failed without cancelling payment!
          if (job.transaction_id) {
            const tx = store.transactions.find((t) => t.id === job.transaction_id);
            if (tx) {
              tx.provisioning_status = 'provisioning_failed';
              tx.retry_count = job.attempts;
              tx.updated_at = new Date().toISOString();
            }
          }

          // Trigger administrator notification
          store.notifications.unshift({
            id: store.notifications.length + 1,
            org_id: job.org_id,
            type: 'provisioning_failed',
            title: `Provisioning Alert: Job #${job.id}`,
            message: `Automated provisioning to ${job.target_type} failed after ${job.attempts} attempts: ${job.error_message}. Payment is secure and marked for manual retry.`,
            severity: 'error',
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  /**
   * Executes hardware provisioning for MikroTik or Omada
   */
  private static async executeJob(job: ProvisioningJob): Promise<boolean> {
    const { target_type, target_id, payload } = job;

    if (target_type === 'mikrotik') {
      const router = store.routers.find((r) => r.id === target_id);
      if (!router) {
        throw new Error(`Target MikroTik router #${target_id} not found`);
      }
      // If router offline in production, throw to trigger resilient retry
      if (router.status === 'offline') {
        throw new Error(`Router "${router.name}" currently offline, awaiting heartbeat reconnect.`);
      }
      return true;
    }

    if (target_type === 'omada') {
      const controller = store.omadaControllers.find((c) => c.id === target_id);
      if (!controller) {
        throw new Error(`Target Omada controller #${target_id} not found`);
      }
      return await OmadaService.syncVoucher({
        controller,
        voucherCode: payload.voucherCode || 'VOUCH',
        durationMin: payload.durationMin || 60,
        rateLimitRx: payload.rateLimitRx || '5M',
        rateLimitTx: payload.rateLimitTx || '5M',
      });
    }

    if (target_type === 'radius') {
      const voucher = store.vouchers.find((v) => v.id === payload.voucherId);
      const plan = store.profiles.find((p) => p.id === payload.planId);
      if (voucher) {
        await RadiusService.syncVoucher(voucher, plan);
      }
      return true;
    }

    return true;
  }
}
