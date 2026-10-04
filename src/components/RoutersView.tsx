import React, { useState } from 'react';
import {
  Router as RouterIcon,
  Plus,
  Play,
  FileCode,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { RouterItem } from '../types';
import { apiFetch } from '../api/client';

interface RoutersViewProps {
  routers: RouterItem[];
  onRefresh: () => void;
  onOpenAddRouter: () => void;
  onOpenProvision: (router: RouterItem) => void;
}

export const RoutersView: React.FC<RoutersViewProps> = ({
  routers,
  onRefresh,
  onOpenAddRouter,
  onOpenProvision,
}) => {
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; message: string; success: boolean } | null>(null);

  const handleTestConnection = async (router: RouterItem) => {
    setTestingId(router.id);
    setTestResult(null);
    try {
      const res = await apiFetch(`/api/routers/${router.id}/test`, { method: 'POST' });
      if (res.success) {
        setTestResult({
          id: router.id,
          message: `Connected successfully! Model: ${res.data?.boardName}, CPU: ${res.data?.cpuLoad}%, Uptime: ${res.data?.uptime}`,
          success: true,
        });
        onRefresh();
      } else {
        setTestResult({
          id: router.id,
          message: `Connection failed: ${res.error || 'Router unreachable'}`,
          success: false,
        });
      }
    } catch (err: any) {
      setTestResult({
        id: router.id,
        message: err.message,
        success: false,
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <RouterIcon className="w-5 h-5 text-cyan-400" />
            <span>MikroTik RouterOS Fleet</span>
          </h1>
          <p className="text-xs text-slate-400">
            RouterOS v7 REST API / Classic API, WireGuard Central Tunnel, and Auto-Heartbeats
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Router List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddRouter}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register Router</span>
          </button>
        </div>
      </div>

      {/* Test Notice if any */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            testResult.success
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Routers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {routers.map((router) => {
          const isOnline = router.status === 'online';
          const isTesting = testingId === router.id;

          return (
            <div
              key={router.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
            >
              {/* Header: Name & Status Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{router.name}</h3>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                      ID #{router.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{router.location || 'Tanzania Hub'}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                    isOnline
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                      : 'bg-red-950 border border-red-800 text-red-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {router.status}
                </span>
              </div>

              {/* IP & Technical Parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">Management IP:</span>
                  <span className="font-mono text-slate-200 font-semibold">{router.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">WireGuard Tunnel IP:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{router.wireguard_ip || '10.88.0.x'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">API / REST Ports:</span>
                  <span className="font-mono text-slate-300">
                    {router.api_port} (API) / {router.rest_port} (REST)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hardware / OS:</span>
                  <span className="text-slate-300 truncate block">
                    {router.model || 'MikroTik'} ({router.ros_version || 'v7'})
                  </span>
                </div>
              </div>

              {/* Hardware Telemetry Progress */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>CPU Load</span>
                    </span>
                    <span className="font-semibold text-white">{router.cpu_load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        router.cpu_load > 80 ? 'bg-red-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.max(5, router.cpu_load)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-400" />
                      <span>Free RAM</span>
                    </span>
                    <span className="font-semibold text-white">{router.free_memory_mb} MB</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((router.free_memory_mb / (router.total_memory_mb || 1024)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Uptime: {router.uptime || 'Unknown'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(router)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Connecting...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={() => onOpenProvision(router)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Provision Script</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
