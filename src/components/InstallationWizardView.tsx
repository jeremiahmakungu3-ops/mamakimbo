import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Zap,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Radio,
  ArrowRight,
  ShieldCheck,
  Network,
  Cpu,
  Cable,
  CheckCircle,
} from 'lucide-react';
import { HardwareModel } from '../types';
import { apiFetch } from '../api/client';

interface InstallationWizardViewProps {
  onInstallationSuccess: () => void;
}

export const InstallationWizardView: React.FC<InstallationWizardViewProps> = ({ onInstallationSuccess }) => {
  const [models, setModels] = useState<HardwareModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('ccr2004');
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');

  // Automatic bootstrap states
  const [routerName, setRouterName] = useState('MikroTik CCR2004 - Dodoma City Point');
  const [ipAddress, setIpAddress] = useState('197.250.33.15');
  const [apiPort, setApiPort] = useState(8728);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('Dodoma CBD Core');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<any | null>(null);

  // Manual copy states
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<HardwareModel[]>('/api/installation/hardware-models')
      .then(setModels)
      .catch(() => []);
  }, []);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleAutoBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBootstrapping(true);
    setBootstrapResult(null);

    try {
      const res = await apiFetch('/api/installation/auto-bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          name: routerName,
          modelId: selectedModelId,
          ipAddress,
          apiPort,
          username,
          password,
          location,
        }),
      });
      setBootstrapResult(res);
      onInstallationSuccess();
    } catch (err: any) {
      alert(`Bootstrap failed: ${err.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleCopyCode = (code: string, stepIndex: number) => {
    navigator.clipboard.writeText(code);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Hardware Provisioning & Installation Wizard</span>
          </h1>
          <p className="text-xs text-slate-400">
            Physical Port Wiring Guides, Automated Bootstrap & Model-Specific Terminal Scripts
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('automatic')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'automatic'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Automatic Mode</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Manual Step-by-Step</span>
          </button>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <label className="text-xs font-semibold uppercase text-slate-400 block mb-3">
          Select Hardware Model to View Physical Port Diagram & Wiring
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {models.map((m) => {
            const isSelected = selectedModelId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] text-cyan-400 font-mono block">{m.vendor}</span>
                <span className="text-xs font-bold text-white block mt-0.5 truncate">{m.name}</span>
                <span className="text-[10px] text-slate-500 mt-1 block">{m.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PHYSICAL CONNECTION WIRING BLUEPRINT */}
      {selectedModel && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cable className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Physical Connection Diagram: {selectedModel.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Default IP: <strong className="font-mono text-cyan-400">{selectedModel.defaultIp}</strong> • Power: {selectedModel.powerReq}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              User: {selectedModel.defaultUser}
            </span>
          </div>

          {/* Model Port Wiring Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {selectedModel.ports.map((port, idx) => (
              <div
                key={port.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-400">{port.label}</span>
                  <span
                    className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                      port.role.includes('WAN')
                        ? 'bg-amber-950 border border-amber-800 text-amber-400'
                        : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                    }`}
                  >
                    {port.role.split(' ')[0]}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">{port.role}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{port.recommended}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 1: AUTOMATIC BOOTSTRAP WIZARD */}
      {mode === 'automatic' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Automatic 1-Click Bootstrap Installation</h2>
                <p className="text-xs text-slate-400">
                  Connect cable to Port 1 (WAN) • Enter device IP • XCLOUD auto-provisions and verifies ONLINE state
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Zero-Touch Deployment
            </span>
          </div>

          {bootstrapResult ? (
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 space-y-4">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-base">
                <CheckCircle2 className="w-6 h-6" />
                <span>{bootstrapResult.message}</span>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stages Completed Successfully:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {bootstrapResult.stagesCompleted.map((stage: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-300">
                  Router WireGuard IP: <strong className="font-mono text-cyan-400">{bootstrapResult.router.wireguard_ip}</strong>
                </span>
                <button
                  onClick={() => setBootstrapResult(null)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                >
                  Provision Another Router
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAutoBootstrap} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Router Site Name</label>
                  <input
                    type="text"
                    required
                    value={routerName}
                    onChange={(e) => setRouterName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Location / Ward</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Management IP Address</label>
                  <input
                    type="text"
                    required
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">RouterOS API Port</label>
                  <input
                    type="number"
                    value={apiPort}
                    onChange={(e) => setApiPort(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Admin Password</label>
                  <input
                    type="password"
                    placeholder="Router admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isBootstrapping}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isBootstrapping ? 'animate-bounce' : ''}`} />
                  <span>{isBootstrapping ? 'Running Automated Bootstrap (Stages 1-7)...' : 'Start Automatic Installation'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODE 2: MANUAL STEP-BY-STEP INSTALLATION */}
      {mode === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Manual Terminal Configuration Instructions</h2>
                <p className="text-xs text-slate-400">
                  Step-by-step commands to execute in RouterOS Terminal or SSH console
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              CLI Mode
            </span>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Set System Identity & WireGuard Interface</span>
                </h3>
                <button
                  onClick={() =>
                    handleCopyCode(
                      `/system identity set name="XCLOUD_${selectedModel.id.toUpperCase()}"\n/interface wireguard add listen-port=13231 mtu=1420 name=wg-xcloud`,
                      1
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  {copiedStep === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900/90 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`/system identity set name="XCLOUD_${selectedModel.id.toUpperCase()}"
/interface wireguard add listen-port=13231 mtu=1420 name=wg-xcloud`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Connect WireGuard Peer to Central Gateway</span>
                </h3>
                <button
                  onClick={() =>
                    handleCopyCode(
                      `/ip address add address=10.88.0.5/24 interface=wg-xcloud network=10.88.0.0\n/interface wireguard peers add allowed-address=10.88.0.0/24 endpoint-address="vpn.xcloud.co.tz" endpoint-port=51820 interface=wg-xcloud persistent-keepalive=25s public-key="SERVER_WG_PUBLIC_KEY="`,
                      2
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  {copiedStep === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900/90 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`/ip address add address=10.88.0.5/24 interface=wg-xcloud network=10.88.0.0
/interface wireguard peers add allowed-address=10.88.0.0/24 endpoint-address="vpn.xcloud.co.tz" endpoint-port=51820 interface=wg-xcloud persistent-keepalive=25s public-key="SERVER_WG_PUBLIC_KEY="`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Enable FreeRADIUS Client & Hotspot Accounting</span>
                </h3>
                <button
                  onClick={() =>
                    handleCopyCode(
                      `/radius add address=10.88.0.1 secret="Testing123-XCLOUD-RADIUS-Secret" service=hotspot,wireless timeout=3s\n/ip hotspot profile set [ find default=yes ] use-radius=yes radius-accounting=yes radius-interim-update=5m`,
                      3
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  {copiedStep === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900/90 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`/radius add address=10.88.0.1 secret="Testing123-XCLOUD-RADIUS-Secret" service=hotspot,wireless timeout=3s
/ip hotspot profile set [ find default=yes ] use-radius=yes radius-accounting=yes radius-interim-update=5m`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
