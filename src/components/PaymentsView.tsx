import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  Phone,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Transaction } from '../types';
import { apiFetch } from '../api/client';

interface PaymentsViewProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onOpenInitiatePayment: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  transactions,
  onRefresh,
  onOpenInitiatePayment,
}) => {
  const [simulatingRef, setSimulatingRef] = useState<string | null>(null);

  const handleSimulateInstantConfirm = async (reference: string) => {
    setSimulatingRef(reference);
    try {
      await apiFetch('/api/payments/simulate-instant-success', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulatingRef(null);
    }
  };

  const completed = transactions.filter((t) => t.status === 'completed');
  const totalVolume = completed.reduce((sum, t) => sum + t.amount_tzs, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Tanzania Mobile Money Integrations</span>
          </h1>
          <p className="text-xs text-slate-400">
            Vodacom M-Pesa (Daraja OpenAPI), Tigo Pesa, Airtel Money & AzamPay Unified Gateway
          </p>
        </div>
        <button
          onClick={onOpenInitiatePayment}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20"
        >
          <Send className="w-4 h-4" />
          <span>Initiate Push Payment (STK)</span>
        </button>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vodacom M-Pesa */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-red-400">Vodacom M-Pesa</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
              C2B STK Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Daraja OpenAPI Integration with dynamic STK push</p>
          <div className="mt-3 text-[11px] font-mono text-slate-300">
            Prefixes: 074, 075, 076
          </div>
        </div>

        {/* Tigo Pesa */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-blue-400">Tigo Pesa (Mixx)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
              Biller Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Yas Biller API integration with instant validation</p>
          <div className="mt-3 text-[11px] font-mono text-slate-300">
            Prefixes: 071, 065, 067
          </div>
        </div>

        {/* Airtel Money */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-red-500">Airtel Money</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
              USSD Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Airtel Tanzania developer collections API</p>
          <div className="mt-3 text-[11px] font-mono text-slate-300">
            Prefixes: 078, 068, 069
          </div>
        </div>

        {/* AzamPay Unified */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-cyan-400">AzamPay Aggregator</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
              All MNOs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Unified checkout covering all Tanzania MNOs & Halopesa</p>
          <div className="mt-3 text-[11px] font-mono text-slate-300">
            HMAC-SHA256 Webhook
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Mobile Money Transaction Audit Log ({transactions.length})
          </h2>
          <div className="text-xs font-bold text-emerald-400">
            Total Revenue: {totalVolume.toLocaleString()} TZS
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Transaction Reference</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Amount (TZS)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-white block">{tx.reference}</span>
                    {tx.external_reference && (
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Ext: {tx.external_reference}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-200 uppercase font-mono text-[11px]">
                      {tx.provider.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">{tx.phone_number}</td>
                  <td className="py-3 px-3 capitalize text-slate-300">
                    {tx.type.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                    {tx.amount_tzs.toLocaleString()} TZS
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        tx.status === 'completed'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-amber-950 border border-amber-800 text-amber-400'
                          : 'bg-red-950 border border-red-800 text-red-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {tx.status === 'pending' && (
                      <button
                        onClick={() => handleSimulateInstantConfirm(tx.reference)}
                        disabled={simulatingRef === tx.reference}
                        className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-semibold transition"
                      >
                        {simulatingRef === tx.reference ? 'Processing...' : 'Simulate Success'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
