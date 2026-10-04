import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Ticket, Download, Calendar, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api/client';

export const ReportsView: React.FC = () => {
  const [financial, setFinancial] = useState<any | null>(null);
  const [voucherReport, setVoucherReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiFetch('/api/reports/financial'),
      apiFetch('/api/reports/vouchers'),
    ])
      .then(([fin, vouch]) => {
        setFinancial(fin);
        setVoucherReport(vouch);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ financial, voucherReport }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `xcloud_financial_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Financial & Bandwidth Analytics Reports</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated Tanzania Mobile Money Reconciliation, Voucher Breakage & Consumption Audits
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Financial Audit</span>
        </button>
      </div>

      {/* KPI Overview */}
      {financial && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold uppercase text-slate-400">Gross Collections</span>
            <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
              {financial.totalGrossTzs.toLocaleString()} <span className="text-xs text-slate-400">TZS</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Across {financial.totalTransactions} verified transactions
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold uppercase text-slate-400">Gateway Fees</span>
            <div className="mt-2 text-2xl font-black text-amber-400 font-mono">
              {financial.totalFeesTzs.toLocaleString()} <span className="text-xs text-slate-400">TZS</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">1.5% Average provider interchange</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold uppercase text-slate-400">Net ISP Revenue</span>
            <div className="mt-2 text-2xl font-black text-cyan-400 font-mono">
              {financial.netRevenueTzs.toLocaleString()} <span className="text-xs text-slate-400">TZS</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Net bank settlement ready</span>
          </div>
        </div>
      )}

      {/* Provider Breakdown Cards */}
      {financial && financial.byProvider && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Revenue by Mobile Network Operator (Tanzania MNOs)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(financial.byProvider).map(([providerKey, data]: any) => (
              <div key={providerKey} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono block">
                  {providerKey.replace('_', ' ')}
                </span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {data.volume.toLocaleString()} TZS
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{data.count} Payments</span>
                  <span>Fee: {data.fees.toLocaleString()} TZS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voucher Metrics */}
      {voucherReport && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Voucher Inventory & Conversion Analytics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Total Minted:</span>
              <span className="text-xl font-bold text-white font-mono">{voucherReport.totalGenerated}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Active in Market:</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">{voucherReport.activeCount}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Redeemed & Used:</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{voucherReport.usedCount}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Conversion Rate:</span>
              <span className="text-xl font-bold text-purple-400 font-mono">{voucherReport.conversionRatePercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
