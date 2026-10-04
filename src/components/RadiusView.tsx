import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, RefreshCw, Server, CheckCircle2, Lock, ListFilter } from 'lucide-react';
import { apiFetch } from '../api/client';

export const RadiusView: React.FC = () => {
  const [subTab, setSubTab] = useState<'radcheck' | 'radreply' | 'radacct' | 'nas'>('radcheck');
  const [radcheck, setRadcheck] = useState<any[]>([]);
  const [radreply, setRadreply] = useState<any[]>([]);
  const [radacct, setRadacct] = useState<any[]>([]);
  const [nas, setNas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [checkRes, replyRes, acctRes, nasRes] = await Promise.all([
        apiFetch('/api/radius/radcheck'),
        apiFetch('/api/radius/radreply'),
        apiFetch('/api/radius/radacct'),
        apiFetch('/api/radius/nas'),
      ]);
      setRadcheck(checkRes);
      setRadreply(replyRes);
      setRadacct(acctRes);
      setNas(nasRes);
    } catch (err: any) {
      console.error('Failed to load RADIUS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setSyncStatus('Synchronizing...');
    try {
      const res = await apiFetch('/api/radius/sync-all', { method: 'POST' });
      setSyncStatus(res.message);
      await loadData();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <span>FreeRADIUS RFC-Compliant AAA Architecture</span>
          </h1>
          <p className="text-xs text-slate-400">
            rlm_rest Authorize & Accounting, RadCheck Credentials, RadReply Bandwidth Policies & NAS Directory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reload Tables"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSyncAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync RADIUS Rules</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">radcheck Table</span>
          <div className="mt-2 text-2xl font-bold text-white">{radcheck.length}</div>
          <span className="text-[11px] text-slate-400">Active Authentication Rules</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">radreply Table</span>
          <div className="mt-2 text-2xl font-bold text-cyan-400">{radreply.length}</div>
          <span className="text-[11px] text-slate-400">Rate Limit & Timeout Policies</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">radacct Sessions</span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{radacct.length}</div>
          <span className="text-[11px] text-slate-400">Accounting Logs Recorded</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">NAS Clients</span>
          <div className="mt-2 text-2xl font-bold text-purple-400">{nas.length}</div>
          <span className="text-[11px] text-slate-400">Registered MikroTik Routers</span>
        </div>
      </div>

      {/* Sub-tab selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'radcheck', label: 'radcheck (Credentials)' },
            { id: 'radreply', label: 'radreply (Attributes)' },
            { id: 'radacct', label: 'radacct (Accounting)' },
            { id: 'nas', label: 'nas (MikroTik Clients)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                subTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tab: radcheck */}
        {subTab === 'radcheck' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Username / Voucher</th>
                  <th className="py-2.5 px-3">Attribute</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {radcheck.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 text-slate-500">{item.id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{item.username}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{item.attribute}</td>
                    <td className="py-2.5 px-3 text-amber-400">{item.op}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab: radreply */}
        {subTab === 'radreply' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Username / Voucher</th>
                  <th className="py-2.5 px-3">Attribute</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Value (Policy)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {radreply.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 text-slate-500">{item.id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{item.username}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{item.attribute}</td>
                    <td className="py-2.5 px-3 text-amber-400">{item.op}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab: radacct */}
        {subTab === 'radacct' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">NAS IP</th>
                  <th className="py-2.5 px-3">Framed IP</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Traffic (Download)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {radacct.map((item) => (
                  <tr key={item.radacctid} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 text-slate-400">{item.acctsessionid}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{item.username}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{item.nasipaddress}</td>
                    <td className="py-2.5 px-3 text-slate-300">{item.framedipaddress || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{item.acctsessiontime}s</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {(item.acctoutputoctets / (1024 * 1024)).toFixed(1)} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab: nas */}
        {subTab === 'nas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">NAS IP Address</th>
                  <th className="py-2.5 px-3">Short Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">RADIUS Secret</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {nas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{item.nasname}</td>
                    <td className="py-2.5 px-3 text-slate-200">{item.shortname}</td>
                    <td className="py-2.5 px-3 uppercase text-amber-400">{item.type}</td>
                    <td className="py-2.5 px-3 text-slate-400">••••••••••••</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
