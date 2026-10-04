import React, { useState } from 'react';
import { Ticket, X, CheckCircle2 } from 'lucide-react';
import { HotspotProfile, RouterItem, Agent } from '../types';
import { apiFetch } from '../api/client';

interface GenerateVouchersModalProps {
  profiles: HotspotProfile[];
  routers: RouterItem[];
  agents: Agent[];
  onSuccess: () => void;
  onClose: () => void;
}

export const GenerateVouchersModal: React.FC<GenerateVouchersModalProps> = ({
  profiles,
  routers,
  agents,
  onSuccess,
  onClose,
}) => {
  const [profileId, setProfileId] = useState<number>(profiles[0]?.id || 1);
  const [routerId, setRouterId] = useState<number | ''>('');
  const [agentId, setAgentId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(20);
  const [prefix, setPrefix] = useState<string>('DAR');
  const [format, setFormat] = useState<'numeric' | 'alphanumeric'>('numeric');
  const [codeLength, setCodeLength] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProfile = profiles.find((p) => p.id === profileId) || profiles[0];
  const totalValueTzs = (selectedProfile?.price_tzs || 1000) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch('/api/vouchers/generate', {
        method: 'POST',
        body: JSON.stringify({
          profileId,
          routerId: routerId ? Number(routerId) : null,
          agentId: agentId ? Number(agentId) : null,
          quantity,
          prefix,
          format,
          codeLength,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to generate vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Generate Hotspot Vouchers</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Select Bandwidth Profile</label>
            <select
              value={profileId}
              onChange={(e) => setProfileId(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price_tzs.toLocaleString()} TZS ({p.rate_limit_rx})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Batch Quantity</label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Code Prefix</label>
              <input
                type="text"
                maxLength={6}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Code Character Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="numeric">Numbers Only (0-9)</option>
                <option value="alphanumeric">Alphanumeric (A-Z, 0-9)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Assign Reseller / Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Direct ISP Inventory</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch Summary */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Total Batch Value:</span>
              <span className="font-bold text-emerald-400 text-sm">{totalValueTzs.toLocaleString()} TZS</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Sample Code Preview:</span>
              <span className="font-mono text-cyan-400 font-bold">{prefix}-74921 (PIN: 8821)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20"
            >
              {isLoading ? 'Generating & Syncing RADIUS...' : `Generate ${quantity} Vouchers`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
