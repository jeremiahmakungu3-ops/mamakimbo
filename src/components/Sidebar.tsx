import React from 'react';
import {
  LayoutDashboard,
  Router as RouterIcon,
  Wifi,
  Wrench,
  Ticket,
  Users,
  Layers,
  CreditCard,
  Briefcase,
  KeyRound,
  BarChart3,
  Activity,
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'routers'
  | 'omada'
  | 'installation'
  | 'vouchers'
  | 'customers'
  | 'subscriptions'
  | 'payments'
  | 'agents'
  | 'radius'
  | 'reports'
  | 'health';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'routers', label: 'MikroTik Fleet', icon: RouterIcon, badge: 'RouterOS' },
    { id: 'omada', label: 'TP-Link Omada', icon: Wifi, badge: 'OC200' },
    { id: 'installation', label: 'Installation Wizard', icon: Wrench, badge: 'Wiring' },
    { id: 'vouchers', label: 'Hotspot & Vouchers', icon: Ticket, badge: null },
    { id: 'customers', label: 'Subscribers (PPPoE)', icon: Users, badge: null },
    { id: 'subscriptions', label: 'Subscriptions', icon: Layers, badge: null },
    { id: 'payments', label: 'Tanzania Payments', icon: CreditCard, badge: 'TZS' },
    { id: 'agents', label: 'Resellers & POS', icon: Briefcase, badge: null },
    { id: 'radius', label: 'FreeRADIUS AAA', icon: KeyRound, badge: null },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3, badge: null },
    { id: 'health', label: 'Cloud Run & Health', icon: Activity, badge: 'v2.0' },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/90 lg:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
      <div className="p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as TabType)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap lg:whitespace-normal ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 border border-slate-700 text-cyan-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
