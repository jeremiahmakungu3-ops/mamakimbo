import React from 'react';
import { Printer, X, Wifi } from 'lucide-react';
import { Voucher } from '../types';

interface VoucherPrintModalProps {
  vouchers: Voucher[];
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({ vouchers, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-white text-base">Bulk Voucher Thermal Cards ({vouchers.length})</h2>
              <p className="text-xs text-slate-400">Ready to print for physical distribution or thermal receipts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Cards</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Cards Grid */}
        <div className="p-6 overflow-y-auto print:p-0 print:m-0 bg-slate-950/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="bg-white text-slate-900 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col justify-between shadow-sm page-break-inside-avoid"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-cyan-600" />
                      <span className="font-extrabold text-xs tracking-wider uppercase">NetPulse Wi-Fi</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {v.price_tzs.toLocaleString()} TZS
                    </span>
                  </div>

                  <div className="space-y-1 my-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Voucher Code / Username</div>
                    <div className="text-lg font-black tracking-widest font-mono text-slate-900">{v.code}</div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mt-1">PIN / Password</div>
                    <div className="text-base font-extrabold tracking-wider font-mono text-cyan-700">{v.password}</div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 mt-2">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <strong className="text-slate-700">{v.profileName || 'Hotspot Plan'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed Limit:</span>
                      <strong className="font-mono text-slate-700">{v.rateLimit || '5M/5M'}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t text-[9px] text-center text-slate-400">
                  Connect to Wi-Fi SSID • Open browser • Enter Code & PIN
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
