import React from 'react';
import { Radio, ShieldCheck, User, LogOut, Bell, Building2 } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onlineRoutersCount: number;
  totalRoutersCount: number;
  orgName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenLogin,
  onOpenNotifications,
  unreadCount,
  onlineRoutersCount,
  totalRoutersCount,
  orgName = 'FastNet Tanzania',
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                XCLOUD
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                ISP & Hotspot
              </span>
            </div>
            <p className="text-[11px] text-slate-400">MikroTik • TP-Link Omada • FreeRADIUS</p>
          </div>
        </div>

        {/* Tenant Chip & Hardware Status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">{orgName}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Routers:</span>
            <span className="text-emerald-400 font-bold">{onlineRoutersCount}/{totalRoutersCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>WireGuard Hub</span>
          </div>
        </div>

        {/* Right Actions: Notifications & Account */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">{currentUser.full_name}</div>
                <div className="text-xs text-cyan-400 font-mono capitalize">{currentUser.role}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white font-bold text-sm shadow">
                {currentUser.username[0].toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20"
            >
              <User className="w-4 h-4" />
              <span>Operator Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
