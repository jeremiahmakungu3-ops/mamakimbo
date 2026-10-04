import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Plus,
  Play,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Laptop,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { OmadaControllerItem, OmadaDeviceItem } from '../types';
import { apiFetch } from '../api/client';

export const OmadaView: React.FC = () => {
  const [controllers, setControllers] = useState<OmadaControllerItem[]>([]);
  const [selectedController, setSelectedController] = useState<OmadaControllerItem | null>(null);
  const [devices, setDevices] = useState<OmadaDeviceItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Add Controller
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://omada.domain.tz:8043');
  const [operatorId, setOperatorId] = useState('admin');
  const [password, setPassword] = useState('');
  const [siteId, setSiteId] = useState('default');
  const [siteName, setSiteName] = useState('Default Site');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadControllers = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<OmadaControllerItem[]>('/api/omada/controllers');
      setControllers(res);
      if (res.length > 0 && !selectedController) {
        setSelectedController(res[0]);
      }
    } catch (err: any) {
      console.error('Failed to load Omada controllers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadControllers();
  }, []);

  useEffect(() => {
    if (selectedController) {
      apiFetch<OmadaDeviceItem[]>(`/api/omada/controllers/${selectedController.id}/devices`)
        .then(setDevices)
        .catch(() => setDevices([]));

      apiFetch<any[]>(`/api/omada/controllers/${selectedController.id}/clients`)
        .then(setClients)
        .catch(() => setClients([]));
    }
  }, [selectedController]);

  const handleTestController = async (ctrl: OmadaControllerItem) => {
    setTestingId(ctrl.id);
    try {
      const res = await apiFetch(`/api/omada/controllers/${ctrl.id}/test`, { method: 'POST' });
      setSyncNotice(res.success ? `Connected to ${res.controllerModel} (${res.version}).` : `Failed: ${res.error}`);
      setTimeout(() => setSyncNotice(null), 4000);
      loadControllers();
    } catch (err: any) {
      setSyncNotice(`Connection error: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncPlans = async (ctrl: OmadaControllerItem) => {
    try {
      const res = await apiFetch(`/api/omada/controllers/${ctrl.id}/sync-plans`, { method: 'POST' });
      setSyncNotice(res.message);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/api/omada/controllers', {
        method: 'POST',
        body: JSON.stringify({ name, url, operatorId, password, siteId, siteName }),
      });
      setShowAddModal(false);
      setName('');
      setPassword('');
      loadControllers();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            <span>TP-Link Omada Controller Integration</span>
          </h1>
          <p className="text-xs text-slate-400">
            Hardware (OC200/OC300), Cloud & Software Controllers • Gateways, JetStream Switches & EAP Access Points
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadControllers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Controller</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Controllers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {controllers.map((ctrl) => {
          const isSelected = selectedController?.id === ctrl.id;
          const isTesting = testingId === ctrl.id;
          return (
            <div
              key={ctrl.id}
              onClick={() => setSelectedController(ctrl)}
              className={`p-5 rounded-2xl border cursor-pointer transition ${
                isSelected
                  ? 'border-cyan-500 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{ctrl.name}</h3>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">{ctrl.url}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 uppercase">
                  {ctrl.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px] block">Adopted Devices:</span>
                  <span className="font-bold text-cyan-400 text-sm">{ctrl.total_devices}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Active Clients:</span>
                  <span className="font-bold text-emerald-400 text-sm">{ctrl.total_clients}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Managed Site:</span>
                  <span className="text-slate-200 truncate block font-medium">{ctrl.site_name}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Last Sync: {ctrl.last_sync ? new Date(ctrl.last_sync).toLocaleTimeString() : 'Never'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestController(ctrl);
                    }}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    {isTesting ? 'Testing...' : 'Test API'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncPlans(ctrl);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition"
                  >
                    Push Plans
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Controller Hardware & Clients */}
      {selectedController && (
        <div className="space-y-6">
          {/* Adopted Devices Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Adopted Omada Hardware Devices ({devices.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Site: {selectedController.site_name}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Device Name & Type</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">MAC Address</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Firmware</th>
                    <th className="py-2.5 px-3">Clients</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {devices.map((d) => (
                    <tr key={d.mac} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{d.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                          {d.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{d.model}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{d.mac}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{d.ip}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{d.version}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{d.clientCount} active</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold uppercase">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Wireless Hotspot Clients */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Live Omada Wi-Fi Hotspot Clients ({clients.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Reported via Omada OpenAPI</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Client Device</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">MAC Address</th>
                    <th className="py-2.5 px-3">SSID</th>
                    <th className="py-2.5 px-3">Connected Duration</th>
                    <th className="py-2.5 px-3">Traffic (Down)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {clients.map((c) => (
                    <tr key={c.mac} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-[10px] text-slate-400">{c.deviceType}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{c.ip}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{c.mac}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">{c.ssid}</td>
                      <td className="py-2.5 px-3">{c.uptime}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {(c.trafficDown / (1024 * 1024)).toFixed(1)} MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Controller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="font-bold text-white text-base">Connect TP-Link Omada Controller</h2>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Controller Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omada OC200 - Slipway Waterfront"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Controller URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  placeholder="https://192.168.0.253:8043 or https://omada.domain.tz:8043"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Operator Username</label>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Operator Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Site ID</label>
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Site Display Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
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
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Connecting...' : 'Authorize Controller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
