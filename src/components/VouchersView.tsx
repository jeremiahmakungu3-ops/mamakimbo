import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Printer,
  Search,
  Filter,
  Users,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  Wifi,
  Ban,
} from 'lucide-react';
import { Voucher, HotspotProfile, ActiveSession } from '../types';
import { apiFetch } from '../api/client';

interface VouchersViewProps {
  vouchers: Voucher[];
  profiles: HotspotProfile[];
  activeSessions: ActiveSession[];
  onRefresh: () => void;
  onOpenGenerate: () => void;
  onOpenPrint: (vouchers: Voucher[]) => void;
}

export const VouchersView: React.FC<VouchersViewProps> = ({
  vouchers,
  profiles,
  activeSessions,
  onRefresh,
  onOpenGenerate,
  onOpenPrint,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.password.includes(search) ||
      (v.batch_id && v.batch_id.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDisconnect = async (session: ActiveSession) => {
    setDisconnectingId(session.id);
    try {
      await apiFetch(`/api/hotspot/active-sessions/${session.id}/disconnect`, { method: 'POST' });
      onRefresh();
    } catch (err: any) {
      alert(`Disconnect failed: ${err.message}`);
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleRevoke = async (voucher: Voucher) => {
    if (!confirm(`Are you sure you want to revoke voucher ${voucher.code}?`)) return;
    try {
      await apiFetch(`/api/vouchers/${voucher.id}/revoke`, { method: 'PATCH' });
      onRefresh();
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <span>Hotspot & Voucher Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Bandwidth Rate Limits, Bulk Generation, Thermal Voucher Printing & FreeRADIUS Sync
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenPrint(filteredVouchers.slice(0, 50))}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Batch</span>
          </button>
          <button
            onClick={onOpenGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Vouchers</span>
          </button>
        </div>
      </div>

      {/* Profiles Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white truncate">{p.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                {p.rate_limit_rx}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-emerald-400">
              {p.price_tzs.toLocaleString()} <span className="text-[10px] text-slate-400">TZS</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{p.session_timeout_min >= 60 ? `${p.session_timeout_min / 60}h` : `${p.session_timeout_min}m`}</span>
              <span className="mx-1">•</span>
              <span>{p.shared_users} Device{p.shared_users > 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Active Hotspot Sessions on Routers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Active Hotspot Sessions ({activeSessions.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Queried via RouterOS /ip/hotspot/active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Voucher / User</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Uptime</th>
                <th className="py-2.5 px-3">Downloaded</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {activeSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-white font-mono">{s.user}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-400">{s.address}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{s.macAddress}</td>
                  <td className="py-2.5 px-3">{s.uptime}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">
                    {(s.bytesOut / (1024 * 1024)).toFixed(1)} MB
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDisconnect(s)}
                      disabled={disconnectingId === s.id}
                      className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-medium transition"
                    >
                      {disconnectingId === s.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, PIN, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {['all', 'active', 'used', 'expired'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded capitalize font-medium transition ${
                    statusFilter === st ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Voucher Code</th>
                <th className="py-2.5 px-3">PIN</th>
                <th className="py-2.5 px-3">Profile / Speed</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{v.code}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-400">{v.password}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-slate-200">{v.profileName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{v.rateLimit}</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    {v.price_tzs.toLocaleString()} TZS
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{v.batch_id}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        v.status === 'active'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                          : v.status === 'used'
                          ? 'bg-blue-950 border border-blue-800 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {v.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(v)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
                        title="Revoke Voucher"
                      >
                        <Ban className="w-3.5 h-3.5" />
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
