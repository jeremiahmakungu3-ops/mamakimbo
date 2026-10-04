import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { HotspotProfile } from '../types';
import { apiFetch } from '../api/client';

interface AddCustomerModalProps {
  profiles: HotspotProfile[];
  onSuccess: () => void;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  profiles,
  onSuccess,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+255 ');
  const [email, setEmail] = useState('');
  const [profileId, setProfileId] = useState<number>(profiles[0]?.id || 1);
  const [connectionType, setConnectionType] = useState<'hotspot' | 'pppoe' | 'static'>('hotspot');
  const [initialBalanceTzs, setInitialBalanceTzs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          username,
          fullName,
          phone,
          email: email || undefined,
          profileId,
          connectionType,
          initialBalanceTzs,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add subscriber');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Add Broadband Subscriber</h2>
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
            <label className="text-xs text-slate-400 block mb-1">Subscriber Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Hassan J. Mrope"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Login Username</label>
              <input
                type="text"
                required
                placeholder="hassan.mrope"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="+255 7..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Email (Optional)</label>
            <input
              type="email"
              placeholder="customer@domain.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Connection Protocol</label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="hotspot">Hotspot Portal</option>
                <option value="pppoe">PPPoE Dial-in</option>
                <option value="static">Static IP Binding</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Assigned Plan</label>
              <select
                value={profileId}
                onChange={(e) => setProfileId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Initial Wallet Balance (TZS)</label>
            <input
              type="number"
              value={initialBalanceTzs}
              onChange={(e) => setInitialBalanceTzs(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
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
              {isLoading ? 'Creating...' : 'Register Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
