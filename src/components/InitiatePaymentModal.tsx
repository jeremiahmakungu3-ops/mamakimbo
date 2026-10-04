import React, { useState } from 'react';
import { CreditCard, X, Send, CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import { HotspotProfile } from '../types';
import { apiFetch } from '../api/client';

interface InitiatePaymentModalProps {
  profiles: HotspotProfile[];
  onSuccess: () => void;
  onClose: () => void;
}

export const InitiatePaymentModal: React.FC<InitiatePaymentModalProps> = ({
  profiles,
  onSuccess,
  onClose,
}) => {
  const [provider, setProvider] = useState<'vodacom_mpesa' | 'tigo_pesa' | 'airtel_money' | 'azampay'>(
    'vodacom_mpesa'
  );
  const [phoneNumber, setPhoneNumber] = useState('255754123456');
  const [amountTzs, setAmountTzs] = useState<number>(3500);
  const [type, setType] = useState<'voucher_purchase' | 'account_topup'>('voucher_purchase');
  const [profileId, setProfileId] = useState<number>(profiles[2]?.id || profiles[0]?.id || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const clean = val.replace(/[^0-9]/g, '');
    const prefix = clean.startsWith('255') ? clean.substring(3, 5) : clean.startsWith('0') ? clean.substring(1, 3) : '';

    if (['74', '75', '76'].includes(prefix)) {
      setProvider('vodacom_mpesa');
    } else if (['71', '65', '67'].includes(prefix)) {
      setProvider('tigo_pesa');
    } else if (['78', '68', '69'].includes(prefix)) {
      setProvider('airtel_money');
    }
  };

  const handleProfileSelect = (pId: number) => {
    setProfileId(pId);
    const p = profiles.find((prof) => prof.id === pId);
    if (p) {
      setAmountTzs(p.price_tzs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          phoneNumber,
          amountTzs,
          type,
          profileId: type === 'voucher_purchase' ? profileId : undefined,
        }),
      });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Tanzania Mobile Money USSD STK</h2>
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

        {result ? (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>USSD Prompt Dispatched!</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{result.message}</p>
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
              <div>Reference: <span className="text-cyan-400 font-bold">{result.reference}</span></div>
              <div>External Ref: <span className="text-slate-400">{result.externalReference}</span></div>
              <div>Status: <span className="text-amber-400 uppercase font-semibold">Pending PIN</span></div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Customer Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="255754000123"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Auto-detects M-Pesa (074-076), Tigo (071, 065, 067), Airtel (078, 068, 069)
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Network Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="vodacom_mpesa">Vodacom Tanzania M-Pesa (Daraja OpenAPI)</option>
                <option value="tigo_pesa">Tigo Pesa (Mixx by Yas Biller)</option>
                <option value="airtel_money">Airtel Money Tanzania</option>
                <option value="azampay">AzamPay Unified National Checkout</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Payment Purpose</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="voucher_purchase">Buy Hotspot Voucher</option>
                  <option value="account_topup">Account Top-up</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount (TZS)</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={amountTzs}
                  onChange={(e) => setAmountTzs(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {type === 'voucher_purchase' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Hotspot Package</label>
                <select
                  value={profileId}
                  onChange={(e) => handleProfileSelect(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price_tzs.toLocaleString()} TZS
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Upon PIN entry on the phone, the voucher is auto-generated & FreeRADIUS rules sync instantly.</span>
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
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
              >
                {isLoading ? 'Dispatching Push...' : 'Send USSD Prompt'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
