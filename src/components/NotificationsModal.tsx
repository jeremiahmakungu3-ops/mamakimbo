import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">System Alerts & Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-slate-800"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No active notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  n.severity === 'error'
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : n.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-white">
                    {n.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : n.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(n.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed pl-5">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
