import React, { useState } from 'react';
import { Users, Plus, DollarSign, Search, ShieldCheck, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { Customer, HotspotProfile } from '../types';
import { apiFetch } from '../api/client';

interface CustomersViewProps {
  customers: Customer[];
  profiles: HotspotProfile[];
  onRefresh: () => void;
  onOpenAddCustomer: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  profiles,
  onRefresh,
  onOpenAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [topupCustomerId, setTopupCustomerId] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupCustomerId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/api/customers/${topupCustomerId}/topup`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: topupAmount }),
      });
      setTopupCustomerId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Top-up failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Broadband & PPPoE Subscribers</span>
          </h1>
          <p className="text-xs text-slate-400">
            Customer Account Provisioning, Wallet Balances, Static IP & PPPoE Profiles
          </p>
        </div>
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Topup Modal if active */}
      {topupCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Top-up Customer Wallet</h3>
            <form onSubmit={handleTopupSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(parseInt(e.target.value, 10) || 0)}
                  min={1000}
                  step={1000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupCustomerId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Crediting...' : 'Confirm Top-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscribers Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Subscriber</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Connection Type</th>
                <th className="py-2.5 px-3">Speed Plan</th>
                <th className="py-2.5 px-3">Wallet Balance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white block">{c.full_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">@{c.username}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 uppercase font-semibold text-slate-300">
                      {c.connection_type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-200 font-medium">{c.profileName}</span>
                    <span className="text-[10px] text-cyan-400 block font-mono">{c.rateLimit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-400 text-sm">
                      {c.balance_tzs.toLocaleString()} TZS
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.status === 'active'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : 'bg-red-950 border border-red-800 text-red-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setTopupCustomerId(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition"
                    >
                      Top-up
                    </button>
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
