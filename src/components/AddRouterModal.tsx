import React, { useState } from 'react';
import { Router as RouterIcon, X } from 'lucide-react';
import { apiFetch } from '../api/client';

interface AddRouterModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AddRouterModal: React.FC<AddRouterModalProps> = ({ onSuccess, onClose }) => {
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [apiPort, setApiPort] = useState(8728);
  const [restPort, setRestPort] = useState(443);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [model, setModel] = useState('MikroTik CCR2004');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch('/api/routers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          ipAddress,
          apiPort,
          restPort,
          username,
          password,
          location,
          model,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add router');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouterIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Register MikroTik Router</h2>
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
            <label className="text-xs text-slate-400 block mb-1">Router Name</label>
            <input
              type="text"
              required
              placeholder="e.g. CCR2004 - Dodoma City Point"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">IP Address / Host</label>
              <input
                type="text"
                required
                placeholder="197.250.x.x"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Location</label>
              <input
                type="text"
                placeholder="Dodoma CBD"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">API Port</label>
              <input
                type="number"
                value={apiPort}
                onChange={(e) => setApiPort(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">REST Port (HTTPS)</label>
              <input
                type="number"
                value={restPort}
                onChange={(e) => setRestPort(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
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
              {isLoading ? 'Registering...' : 'Register Router'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
