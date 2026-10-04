import React, { useState } from 'react';
import { Briefcase, Plus, DollarSign, Phone, MapPin, CheckCircle2, TrendingUp } from 'lucide-react';
import { Agent } from '../types';
import { apiFetch } from '../api/client';

interface AgentsViewProps {
  agents: Agent[];
  onRefresh: () => void;
  onOpenAddAgent: () => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ agents, onRefresh, onOpenAddAgent }) => {
  const [topupAgentId, setTopupAgentId] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupAgentId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/agents/${topupAgentId}/topup-float`, {
        method: 'POST',
        body: JSON.stringify({ amount: topupAmount }),
      });
      setTopupAgentId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Agent float credit failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <span>Voucher Resellers & Agent Network</span>
          </h1>
          <p className="text-xs text-slate-400">
            Float Balance Management, Wholesale Vouchers & Automated Commission Accounting
          </p>
        </div>
        <button
          onClick={onOpenAddAgent}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register Reseller Point</span>
        </button>
      </div>

      {/* Topup Agent Float Modal */}
      {topupAgentId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Top-up Reseller Float</h3>
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Float Amount (TZS)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(parseInt(e.target.value, 10) || 0)}
                  min={5000}
                  step={5000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupAgentId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Crediting...' : 'Credit Float'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{agent.business_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{agent.location || 'Tanzania'}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold uppercase">
                  {agent.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Float Balance:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {agent.float_balance_tzs.toLocaleString()} TZS
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Commission Rate:</span>
                  <span className="font-bold text-cyan-400 text-sm">{agent.commission_percent}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone:</span>
                  <span className="font-mono text-slate-200">{agent.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vouchers Sold:</span>
                  <span className="text-slate-200 font-semibold">{agent.vouchersSoldCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Earned: <strong className="text-slate-200">{agent.commissionEarnedTzs?.toLocaleString() || 0} TZS</strong>
              </span>
              <button
                onClick={() => setTopupAgentId(agent.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
              >
                Top-up Float
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
