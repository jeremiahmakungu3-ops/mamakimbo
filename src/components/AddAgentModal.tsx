import React, { useState } from 'react';
import { Briefcase, X } from 'lucide-react';
import { apiFetch } from '../api/client';

interface AddAgentModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({ onSuccess, onClose }) => {
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('+255 ');
  const [location, setLocation] = useState('');
  const [floatBalanceTzs, setFloatBalanceTzs] = useState<number>(50000);
  const [commissionPercent, setCommissionPercent] = useState<number>(10.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch('/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          userId: 2, // Associate with agent user account
          businessName,
          phone,
          location,
          floatBalanceTzs,
          commissionPercent,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent point');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Register Reseller Point</h2>
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
            <label className="text-xs text-slate-400 block mb-1">Business / Shop Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mbezi Beach Cyber & Telecom"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Agent Phone</label>
              <input
                type="text"
                required
                placeholder="+255 7..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Location / Ward</label>
              <input
                type="text"
                placeholder="Mbezi Beach, DSM"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Initial Float (TZS)</label>
              <input
                type="number"
                min={0}
                step={5000}
                value={floatBalanceTzs}
                onChange={(e) => setFloatBalanceTzs(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Commission Rate (%)</label>
              <input
                type="number"
                min={1}
                max={50}
                step={0.5}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
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
              {isLoading ? 'Registering...' : 'Register Reseller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
