import React, { useState, useEffect } from 'react';
import { Layers, Plus, RefreshCw, CheckCircle2, AlertTriangle, Clock, ShieldCheck, User } from 'lucide-react';
import { SubscriptionItem, Customer, HotspotProfile, RouterItem } from '../types';
import { apiFetch } from '../api/client';

interface SubscriptionsViewProps {
  customers: Customer[];
  profiles: HotspotProfile[];
  routers: RouterItem[];
  onRefresh: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  customers,
  profiles,
  routers,
  onRefresh,
}) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id || 1);
  const [profileId, setProfileId] = useState<number>(profiles[0]?.id || 1);
  const [routerId, setRouterId] = useState<number>(routers[0]?.id || 1);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);

  const loadSubs = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<SubscriptionItem[]>('/api/subscriptions');
      setSubscriptions(res);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubs();
  }, []);

  const handleRetry = async (sub: SubscriptionItem) => {
    setRetryingId(sub.id);
    try {
      await apiFetch(`/api/subscriptions/${sub.id}/retry-provision`, { method: 'POST' });
      await loadSubs();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ customerId, profileId, routerId, durationDays, autoRenew }),
      });
      setShowAddModal(false);
      loadSubs();
    } catch (err: any) {
      alert(`Subscription creation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Broadband & Hotspot Subscriptions</span>
          </h1>
          <p className="text-xs text-slate-400">
            Recurring Customer Access, Auto-Provisioning Retries & Contract Expirations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSubs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Subscriber</th>
                <th className="py-2.5 px-3">Plan / Speed</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">Expires On</th>
                <th className="py-2.5 px-3">Auto-Renew</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white block">{s.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.customerPhone}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-200">{s.planName}</span>
                    <span className="text-[10px] text-cyan-400 block font-mono">{s.rateLimit}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-medium">{s.routerName}</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(s.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-medium">
                    {new Date(s.end_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        s.auto_renew ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.auto_renew ? 'Enabled' : 'Off'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        s.status === 'active'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : s.status === 'provisioning_failed'
                          ? 'bg-amber-950 border border-amber-800 text-amber-400'
                          : 'bg-red-950 border border-red-800 text-red-400'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.status === 'provisioning_failed' && (
                      <button
                        onClick={() => handleRetry(s)}
                        disabled={retryingId === s.id}
                        className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold"
                      >
                        {retryingId === s.id ? 'Retrying...' : 'Retry Provisioning'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="font-bold text-white text-base">New Subscriber Contract</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Plan</label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price_tzs.toLocaleString()} TZS
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Router / Gateway</label>
                  <select
                    value={routerId}
                    onChange={(e) => setRouterId(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {routers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
