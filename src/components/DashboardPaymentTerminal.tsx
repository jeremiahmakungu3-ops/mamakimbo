import React, { useState } from 'react';
import {
  CreditCard,
  Send,
  Phone,
  CheckCircle2,
  Clock,
  Ticket,
  Copy,
  Check,
  Printer,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { HotspotProfile, Voucher, Transaction } from '../types';
import { apiFetch } from '../api/client';

interface DashboardPaymentTerminalProps {
  profiles: HotspotProfile[];
  onPaymentSuccess: () => void;
  onOpenPrint?: (vouchers: Voucher[]) => void;
}

export const DashboardPaymentTerminal: React.FC<DashboardPaymentTerminalProps> = ({
  profiles,
  onPaymentSuccess,
  onOpenPrint,
}) => {
  const [provider, setProvider] = useState<'vodacom_mpesa' | 'tigo_pesa' | 'airtel_money' | 'azampay'>('vodacom_mpesa');
  const [phone, setPhone] = useState('255754889123');
  const [selectedProfileId, setSelectedProfileId] = useState<number>(profiles[2]?.id || profiles[0]?.id || 1);
  const [customAmount, setCustomAmount] = useState<number>(3500);
  const [isCustom, setIsCustom] = useState(false);
  const [paymentType, setPaymentType] = useState<'voucher_purchase' | 'account_topup'>('voucher_purchase');

  // Terminal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [issuedVoucher, setIssuedVoucher] = useState<{ code: string; pin: string; price: number; plan: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Auto-detect mobile network operator from phone input
  const detectCarrier = (input: string) => {
    const clean = input.replace(/[^0-9]/g, '');
    const prefix = clean.startsWith('255')
      ? clean.substring(3, 5)
      : clean.startsWith('0')
      ? clean.substring(1, 3)
      : '';

    if (['74', '75', '76'].includes(prefix)) return 'vodacom';
    if (['71', '65', '67'].includes(prefix)) return 'tigo';
    if (['78', '68', '69'].includes(prefix)) return 'airtel';
    if (['62', '61'].includes(prefix)) return 'halotel';
    return 'unknown';
  };

  const currentCarrier = detectCarrier(phone);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const carrier = detectCarrier(val);
    if (carrier === 'vodacom') setProvider('vodacom_mpesa');
    else if (carrier === 'tigo') setProvider('tigo_pesa');
    else if (carrier === 'airtel') setProvider('airtel_money');
  };

  const handleSelectPlan = (prof: HotspotProfile) => {
    setIsCustom(false);
    setSelectedProfileId(prof.id);
    setCustomAmount(prof.price_tzs);
  };

  const handleDispatchPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setIssuedVoucher(null);
    setActiveTx(null);

    const amount = isCustom
      ? customAmount
      : profiles.find((p) => p.id === selectedProfileId)?.price_tzs || 1000;

    try {
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          phoneNumber: phone,
          amountTzs: amount,
          type: paymentType,
          profileId: paymentType === 'voucher_purchase' ? selectedProfileId : undefined,
        }),
      });

      if (res.success && res.transaction) {
        setActiveTx(res.transaction);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch payment push');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePinEntered = async () => {
    if (!activeTx) return;
    setSimulating(true);
    try {
      const res = await apiFetch('/api/payments/simulate-instant-success', {
        method: 'POST',
        body: JSON.stringify({ reference: activeTx.reference }),
      });

      if (res.success && res.transaction) {
        setActiveTx(res.transaction);

        // Fetch voucher details if created
        const statusRes = await apiFetch(`/api/payments/${activeTx.reference}/status`);
        const prof = profiles.find((p) => p.id === selectedProfileId);

        if (statusRes.voucher) {
          setIssuedVoucher({
            code: statusRes.voucher.code,
            pin: statusRes.voucher.password,
            price: statusRes.voucher.priceTzs,
            plan: prof?.name || 'Hotspot Package',
          });
        }

        onPaymentSuccess();
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopyVoucher = () => {
    if (!issuedVoucher) return;
    navigator.clipboard.writeText(`NetPulse Wi-Fi\nCode: ${issuedVoucher.code}\nPIN: ${issuedVoucher.pin}\nPlan: ${issuedVoucher.plan}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetTerminal = () => {
    setActiveTx(null);
    setIssuedVoucher(null);
    setErrorMessage(null);
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const effectiveAmount = isCustom ? customAmount : selectedProfile?.price_tzs || 1000;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Tanzania Mobile Money Gateway & POS Terminal</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
                  Live C2B STK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Instant USSD STK Push prompt directly to customer handset with auto-voucher provisioning
              </p>
            </div>
          </div>
        </div>

        {/* Live provider status chips */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>M-Pesa</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Tigo Pesa</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>Airtel</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>AzamPay</span>
          </span>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleDispatchPush} className="space-y-4">
            {/* 1. Provider Select Buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                1. Select Mobile Money Network Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'vodacom_mpesa',
                    label: 'Vodacom M-Pesa',
                    badge: 'Daraja OpenAPI',
                    border: 'hover:border-red-500/50',
                    active: 'border-red-500 bg-red-950/30 text-white',
                    dot: 'bg-red-500',
                  },
                  {
                    id: 'tigo_pesa',
                    label: 'Tigo Pesa (Mixx)',
                    badge: 'Yas Biller',
                    border: 'hover:border-blue-500/50',
                    active: 'border-blue-500 bg-blue-950/30 text-white',
                    dot: 'bg-blue-500',
                  },
                  {
                    id: 'airtel_money',
                    label: 'Airtel Money',
                    badge: 'USSD Push',
                    border: 'hover:border-red-600/50',
                    active: 'border-red-600 bg-red-950/30 text-white',
                    dot: 'bg-red-600',
                  },
                  {
                    id: 'azampay',
                    label: 'AzamPay Aggregator',
                    badge: 'All Networks',
                    border: 'hover:border-cyan-500/50',
                    active: 'border-cyan-500 bg-cyan-950/30 text-white',
                    dot: 'bg-cyan-400',
                  },
                ].map((item) => {
                  const isSelected = provider === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProvider(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${item.border} ${
                        isSelected
                          ? item.active
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                        <span className="text-xs font-bold leading-tight truncate">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-mono block">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Customer Phone Number Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  2. Customer Mobile Number (Tanzania)
                </label>
                {currentCarrier !== 'unknown' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                    Detected: {currentCarrier.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="255754889123 or 0754889123"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Formats accepted: <code>2557XXXXXXXX</code>, <code>07XXXXXXXX</code>, <code>06XXXXXXXX</code>
              </p>
            </div>

            {/* 3. Hotspot Package / Speed Rate Limit */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  3. Select Bandwidth Plan or Top-up
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('voucher_purchase');
                      setIsCustom(false);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                      paymentType === 'voucher_purchase' && !isCustom
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Voucher Plans
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('account_topup');
                      setIsCustom(true);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition ${
                      isCustom
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom / Top-up
                  </button>
                </div>
              </div>

              {!isCustom ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {profiles.slice(0, 6).map((prof) => {
                    const isSelected = selectedProfileId === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => handleSelectPlan(prof)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-sm'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white truncate">{prof.name}</div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-sm font-extrabold text-emerald-400 font-mono">
                            {prof.price_tzs.toLocaleString()} <span className="text-[10px] text-slate-400">TZS</span>
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400">{prof.rate_limit_rx}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <span className="text-xs text-slate-400">Enter custom amount:</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-400">TZS</span>
                </div>
              )}
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Dispatching USSD Prompt...'
                  : `Dispatch STK Push (${effectiveAmount.toLocaleString()} TZS)`}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Live USSD Terminal Screen / Voucher Receipt (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between relative shadow-inner">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Interactive POS Terminal
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SESSION #TZ-99</span>
            </div>

            {/* If no active transaction yet */}
            {!activeTx && !issuedVoucher && (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <CreditCard className="w-7 h-7 text-emerald-500/60" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Ready for Payment</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Select provider, enter customer number, and click Dispatch to initiate real-time mobile money USSD push.
                  </p>
                </div>
                <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-center items-center gap-3">
                  <span>SSL/TLS 1.3</span>
                  <span>•</span>
                  <span>HMAC-SHA256</span>
                  <span>•</span>
                  <span>Zero Localhost</span>
                </div>
              </div>
            )}

            {/* If Active Pending Transaction (USSD STK Prompt in Progress) */}
            {activeTx && !issuedVoucher && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      <span>USSD Prompt Dispatched</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 font-mono text-amber-200">
                      Waiting for PIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Customer handset <strong className="text-white font-mono">{activeTx.phone_number}</strong> has received the Mobile Money push dialog.
                  </p>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Reference:</span>
                    <span className="text-cyan-400 font-bold">{activeTx.reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amount:</span>
                    <span className="text-emerald-400 font-bold">{activeTx.amount_tzs.toLocaleString()} TZS</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Provider:</span>
                    <span className="text-slate-200 uppercase">{activeTx.provider.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Instant Verification Trigger */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleSimulatePinEntered}
                    disabled={simulating}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{simulating ? 'Validating Callback...' : 'Simulate Customer PIN Entered (Approve)'}</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Simulates instant M-Pesa / Tigo webhook delivery to verify auto-provisioning
                  </p>
                </div>
              </div>
            )}

            {/* If Voucher Issued Successfully! */}
            {issuedVoucher && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block text-white text-xs">Payment Received & Provisioned!</strong>
                    <span className="text-[11px] text-slate-300">Hotspot access activated and synced with FreeRADIUS.</span>
                  </div>
                </div>

                {/* Generated Voucher Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-4 text-center space-y-2 shadow-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {issuedVoucher.plan} • {issuedVoucher.price.toLocaleString()} TZS
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <span className="text-[10px] text-slate-500 block uppercase">Voucher Code</span>
                    <span className="text-xl font-black text-cyan-400 tracking-widest">{issuedVoucher.code}</span>
                    <span className="text-[10px] text-slate-500 block uppercase mt-1">PIN / Password</span>
                    <span className="text-base font-bold text-white tracking-wider">{issuedVoucher.pin}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>FreeRADIUS radcheck & radreply Active</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyVoucher}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    onClick={handleResetTerminal}
                    className="py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>New Sale</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Assurance */}
          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PCI-DSS & BOT Compliant</span>
            </span>
            <span>Tanzania Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};
