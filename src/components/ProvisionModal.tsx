import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { RouterItem } from '../types';
import { apiFetch } from '../api/client';

interface ProvisionModalProps {
  router: RouterItem;
  onClose: () => void;
}

export const ProvisionModal: React.FC<ProvisionModalProps> = ({ router, onClose }) => {
  const [script, setScript] = useState<string>('');
  const [wireguardConfig, setWireguardConfig] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProvisionScript = async () => {
      try {
        const res = await apiFetch(`/api/routers/${router.id}/provision`, { method: 'POST' });
        setScript(res.mikrotikScript);
        setWireguardConfig(res.serverWgConfig);
      } catch (err: any) {
        setScript(`# Error generating provisioning script: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvisionScript();
  }, [router.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-600/10 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">MikroTik RouterOS Provisioning Script</h2>
              <p className="text-xs text-slate-400">
                Router: {router.name} • WireGuard Tunnel IP: {router.wireguard_ip || '10.88.0.x'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Paste this script into your MikroTik terminal via Winbox or SSH. It configures WireGuard VPN, FreeRADIUS client, and the Cloud Run Heartbeat scheduler automatically.
            </span>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="absolute right-3 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Script'}</span>
            </button>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {isLoading ? 'Generating cryptographic WireGuard keys and provisioning script...' : script}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
