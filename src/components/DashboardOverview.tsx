import React from 'react';
import {
  Router as RouterIcon,
  Activity,
  Ticket,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Radio,
  Cpu,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import { RouterItem, Transaction, Voucher, HotspotProfile } from '../types';
import { TabType } from './Sidebar';
import { DashboardPaymentTerminal } from './DashboardPaymentTerminal';

interface DashboardOverviewProps {
  routers: RouterItem[];
  vouchers: Voucher[];
  transactions: Transaction[];
  profiles: HotspotProfile[];
  onRefresh: () => void;
  onNavigate: (tab: TabType) => void;
  onOpenGenerateVoucher: () => void;
  onOpenInitiatePayment: () => void;
  onOpenPrint?: (vouchers: Voucher[]) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  routers,
  vouchers,
  transactions,
  profiles,
  onRefresh,
  onNavigate,
  onOpenGenerateVoucher,
  onOpenInitiatePayment,
  onOpenPrint,
}) => {
  const onlineRouters = routers.filter((r) => r.status === 'online');
  const activeVouchers = vouchers.filter((v) => v.status === 'active');
  const completedTx = transactions.filter((t) => t.status === 'completed');
  const totalRevenue = completedTx.reduce((sum, t) => sum + t.amount_tzs, 0);

  // Provider volume breakdown
  const mpesaTx = completedTx.filter((t) => t.provider === 'vodacom_mpesa');
  const tigoTx = completedTx.filter((t) => t.provider === 'tigo_pesa');
  const airtelTx = completedTx.filter((t) => t.provider === 'airtel_money');
  const azamTx = completedTx.filter((t) => t.provider === 'azampay');

  const mpesaVol = mpesaTx.reduce((s, t) => s + t.amount_tzs, 0);
  const tigoVol = tigoTx.reduce((s, t) => s + t.amount_tzs, 0);
  const airtelVol = airtelTx.reduce((s, t) => s + t.amount_tzs, 0);
  const azamVol = azamTx.reduce((s, t) => s + t.amount_tzs, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            MikroTik & FreeRADIUS Operations Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Production Network Management • WireGuard Central Gateway • Tanzania Mobile Money
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenGenerateVoucher}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <Ticket className="w-4 h-4" />
            <span>Generate Vouchers</span>
          </button>
          <button
            onClick={onOpenInitiatePayment}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20"
          >
            <CreditCard className="w-4 h-4" />
            <span>M-Pesa / Tigo Push</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Routers Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">MikroTik Routers</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <RouterIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{onlineRouters.length}</span>
            <span className="text-sm text-slate-400">/ {routers.length} online</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Heartbeats active via WireGuard</span>
          </div>
        </div>

        {/* Active Hotspot Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Hotspot Users</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">94</span>
            <span className="text-sm text-slate-400">concurrent clients</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            <span>3 CCR/hEX nodes reporting</span>
          </div>
        </div>

        {/* Active Vouchers in Circulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Vouchers</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{activeVouchers.length}</span>
            <span className="text-sm text-slate-400">available to redeem</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>FreeRADIUS radcheck synced</span>
          </div>
        </div>

        {/* Tanzania Payments Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Collected Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-semibold">TZS</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Vodacom, Tigo, Airtel, AzamPay</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FIRST-CLASS PAYMENT GATEWAY & POS TERMINAL ON DASHBOARD       */}
      {/* ============================================================== */}
      <DashboardPaymentTerminal
        profiles={profiles}
        onPaymentSuccess={onRefresh}
        onOpenPrint={onOpenPrint}
      />

      {/* Mobile Money Provider Distribution Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Tanzania Payment Gateway Live Distribution</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time revenue processing across Vodacom M-Pesa, Tigo Pesa, Airtel Money & AzamPay
            </p>
          </div>
          <button
            onClick={() => onNavigate('payments')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Full payment ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* M-Pesa Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-red-400">Vodacom M-Pesa</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Online
              </span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-2">
              {mpesaVol.toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>{mpesaTx.length} transactions</span>
              <span className="font-mono text-cyan-400">STK 1.8s</span>
            </div>
          </div>

          {/* Tigo Pesa Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-blue-400">Tigo Pesa (Mixx)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Online
              </span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-2">
              {tigoVol.toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>{tigoTx.length} transactions</span>
              <span className="font-mono text-cyan-400">Biller 2.1s</span>
            </div>
          </div>

          {/* Airtel Money Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-red-500">Airtel Money</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Online
              </span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-2">
              {airtelVol.toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>{airtelTx.length} transactions</span>
              <span className="font-mono text-cyan-400">USSD 2.4s</span>
            </div>
          </div>

          {/* AzamPay Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-cyan-400">AzamPay Aggregator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Online
              </span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-2">
              {azamVol.toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>{azamTx.length} transactions</span>
              <span className="font-mono text-cyan-400">Checkout 1.9s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Routers Status Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>MikroTik Router Fleet Status</span>
            </h2>
            <p className="text-xs text-slate-400">Live telemetry reported via WireGuard & RouterOS API</p>
          </div>
          <button
            onClick={() => onNavigate('routers')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <span>Manage fleet</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routers.map((router) => {
            const isOnline = router.status === 'online';
            return (
              <div
                key={router.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">{router.name}</h3>
                      <p className="text-xs text-slate-400">{router.location || 'Tanzania'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isOnline
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : 'bg-red-950 border border-red-800 text-red-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {router.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Public IP:</span>
                      <span className="font-mono text-slate-200">{router.ip_address}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>WireGuard IP:</span>
                      <span className="font-mono text-cyan-400">{router.wireguard_ip || '10.88.0.x'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>RouterOS Version:</span>
                      <span className="text-slate-200">{router.ros_version || 'v7.16'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Uptime:</span>
                      <span className="text-slate-200">{router.uptime || 'Active'}</span>
                    </div>
                  </div>
                </div>

                {/* Resource Bars */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>CPU Load</span>
                      </span>
                      <span className="font-semibold text-white">{router.cpu_load}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          router.cpu_load > 80 ? 'bg-red-500' : router.cpu_load > 50 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.max(5, router.cpu_load)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Recent Transactions & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Recent Mobile Money Payments</span>
            </h2>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    TZ
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{tx.phone_number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 uppercase font-mono text-slate-300">
                        {tx.provider.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{tx.reference}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">{tx.amount_tzs.toLocaleString()} TZS</div>
                  <div className="text-[10px] text-slate-400 capitalize">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FreeRADIUS & Network Infrastructure Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Production Infrastructure Status</span>
            </h2>
            <button
              onClick={() => onNavigate('health')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Inspect probes
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs block">PostgreSQL Database</span>
                <span className="text-[11px] text-slate-400">Schemas, migrations, radcheck/radacct persistence</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                Connected
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs block">FreeRADIUS rlm_rest Engine</span>
                <span className="text-[11px] text-slate-400">AAA Authorize, Authenticate, Accounting webhooks</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                Active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs block">WireGuard VPN Gateway</span>
                <span className="text-[11px] text-slate-400">Subnet: 10.88.0.0/24 (Encrypted router management tunnel)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-semibold">
                Tunnel Ready
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs block">Tanzania Mobile Money Gateway</span>
                <span className="text-[11px] text-slate-400">Vodacom M-Pesa, Tigo Pesa, Airtel, AzamPay</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-semibold">
                Webhooks Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
