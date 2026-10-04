/**
 * XCLOUD Multi-Tenant ISP & Hotspot Controller
 * Real Production Application Entry Point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { RoutersView } from './components/RoutersView';
import { OmadaView } from './components/OmadaView';
import { InstallationWizardView } from './components/InstallationWizardView';
import { VouchersView } from './components/VouchersView';
import { CustomersView } from './components/CustomersView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { PaymentsView } from './components/PaymentsView';
import { AgentsView } from './components/AgentsView';
import { RadiusView } from './components/RadiusView';
import { ReportsView } from './components/ReportsView';
import { SystemHealthView } from './components/SystemHealthView';

// Modals
import { ProvisionModal } from './components/ProvisionModal';
import { VoucherPrintModal } from './components/VoucherPrintModal';
import { LoginModal } from './components/LoginModal';
import { AddRouterModal } from './components/AddRouterModal';
import { GenerateVouchersModal } from './components/GenerateVouchersModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { InitiatePaymentModal } from './components/InitiatePaymentModal';
import { AddAgentModal } from './components/AddAgentModal';
import { NotificationsModal } from './components/NotificationsModal';

import { apiFetch, setAuthToken, getAuthToken } from './api/client';
import {
  User,
  Organization,
  RouterItem,
  Voucher,
  HotspotProfile,
  Customer,
  Transaction,
  Agent,
  ActiveSession,
  NotificationItem,
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    org_id: 1,
    username: 'admin',
    email: 'admin@xcloud.co.tz',
    full_name: 'Chief Network Engineer',
    role: 'superadmin',
    phone: '+255 754 000 001',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const [currentOrg, setCurrentOrg] = useState<Organization | null>({
    id: 1,
    name: 'FastNet Tanzania (Dar es Salaam Hub)',
    slug: 'fastnet-tz',
    currency: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Application Data States
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals visibility states
  const [provisionRouter, setProvisionRouter] = useState<RouterItem | null>(null);
  const [printVouchers, setPrintVouchers] = useState<Voucher[] | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddRouterModal, setShowAddRouterModal] = useState(false);
  const [showGenerateVouchersModal, setShowGenerateVouchersModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showInitiatePaymentModal, setShowInitiatePaymentModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Load All System Data
  const refreshAllData = useCallback(async () => {
    try {
      const [
        routersRes,
        vouchersRes,
        profilesRes,
        customersRes,
        transactionsRes,
        agentsRes,
        sessionsRes,
        notifsRes,
        orgRes,
      ] = await Promise.all([
        apiFetch<RouterItem[]>('/api/routers').catch(() => []),
        apiFetch<Voucher[]>('/api/vouchers').catch(() => []),
        apiFetch<HotspotProfile[]>('/api/hotspot/profiles').catch(() => []),
        apiFetch<Customer[]>('/api/customers').catch(() => []),
        apiFetch<Transaction[]>('/api/transactions').catch(() => []),
        apiFetch<Agent[]>('/api/agents').catch(() => []),
        apiFetch<ActiveSession[]>('/api/hotspot/active-sessions').catch(() => []),
        apiFetch<NotificationItem[]>('/api/notifications').catch(() => []),
        apiFetch<Organization>('/api/organizations/current').catch(() => null),
      ]);

      setRouters(routersRes);
      setVouchers(vouchersRes);
      setProfiles(profilesRes);
      setCustomers(customersRes);
      setTransactions(transactionsRes);
      setAgents(agentsRes);
      setActiveSessions(sessionsRes);
      setNotifications(notifsRes);
      if (orgRes) setCurrentOrg(orgRes);
    } catch (err: any) {
      console.warn('Notice while refreshing data:', err.message);
    }
  }, []);

  // Initial load & authentication check
  useEffect(() => {
    if (getAuthToken()) {
      apiFetch('/api/auth/me')
        .then((res) => {
          if (res.user) setCurrentUser(res.user);
        })
        .catch(() => {});
    }

    refreshAllData();

    // Periodic telemetry refresh every 20 seconds
    const interval = setInterval(refreshAllData, 20000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      console.error(err);
    }
  };

  const onlineRoutersCount = routers.filter((r) => r.status === 'online').length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        unreadCount={unreadCount}
        onlineRoutersCount={onlineRoutersCount}
        totalRoutersCount={routers.length}
        orgName={currentOrg?.name}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} unreadCount={unreadCount} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <DashboardOverview
              routers={routers}
              vouchers={vouchers}
              transactions={transactions}
              profiles={profiles}
              onRefresh={refreshAllData}
              onNavigate={setCurrentTab}
              onOpenGenerateVoucher={() => setShowGenerateVouchersModal(true)}
              onOpenInitiatePayment={() => setShowInitiatePaymentModal(true)}
              onOpenPrint={(batch) => setPrintVouchers(batch)}
            />
          )}

          {currentTab === 'routers' && (
            <RoutersView
              routers={routers}
              onRefresh={refreshAllData}
              onOpenAddRouter={() => setShowAddRouterModal(true)}
              onOpenProvision={(r) => setProvisionRouter(r)}
            />
          )}

          {currentTab === 'omada' && <OmadaView />}

          {currentTab === 'installation' && (
            <InstallationWizardView onInstallationSuccess={refreshAllData} />
          )}

          {currentTab === 'vouchers' && (
            <VouchersView
              vouchers={vouchers}
              profiles={profiles}
              activeSessions={activeSessions}
              onRefresh={refreshAllData}
              onOpenGenerate={() => setShowGenerateVouchersModal(true)}
              onOpenPrint={(batch) => setPrintVouchers(batch)}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              profiles={profiles}
              onRefresh={refreshAllData}
              onOpenAddCustomer={() => setShowAddCustomerModal(true)}
            />
          )}

          {currentTab === 'subscriptions' && (
            <SubscriptionsView
              customers={customers}
              profiles={profiles}
              routers={routers}
              onRefresh={refreshAllData}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              transactions={transactions}
              onRefresh={refreshAllData}
              onOpenInitiatePayment={() => setShowInitiatePaymentModal(true)}
            />
          )}

          {currentTab === 'agents' && (
            <AgentsView
              agents={agents}
              onRefresh={refreshAllData}
              onOpenAddAgent={() => setShowAddAgentModal(true)}
            />
          )}

          {currentTab === 'radius' && <RadiusView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'health' && <SystemHealthView />}
        </main>
      </div>

      {/* Interactive Modals */}
      {provisionRouter && (
        <ProvisionModal
          router={provisionRouter}
          onClose={() => setProvisionRouter(null)}
        />
      )}

      {printVouchers && (
        <VoucherPrintModal
          vouchers={printVouchers}
          onClose={() => setPrintVouchers(null)}
        />
      )}

      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onSuccess={(u) => {
            setCurrentUser(u);
            setShowLoginModal(false);
            refreshAllData();
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {showAddRouterModal && (
        <AddRouterModal
          onSuccess={() => {
            setShowAddRouterModal(false);
            refreshAllData();
          }}
          onClose={() => setShowAddRouterModal(false)}
        />
      )}

      {showGenerateVouchersModal && (
        <GenerateVouchersModal
          profiles={profiles}
          routers={routers}
          agents={agents}
          onSuccess={() => {
            setShowGenerateVouchersModal(false);
            refreshAllData();
          }}
          onClose={() => setShowGenerateVouchersModal(false)}
        />
      )}

      {showAddCustomerModal && (
        <AddCustomerModal
          profiles={profiles}
          onSuccess={() => {
            setShowAddCustomerModal(false);
            refreshAllData();
          }}
          onClose={() => setShowAddCustomerModal(false)}
        />
      )}

      {showInitiatePaymentModal && (
        <InitiatePaymentModal
          profiles={profiles}
          onSuccess={() => {
            refreshAllData();
          }}
          onClose={() => setShowInitiatePaymentModal(false)}
        />
      )}

      {showAddAgentModal && (
        <AddAgentModal
          onSuccess={() => {
            setShowAddAgentModal(false);
            refreshAllData();
          }}
          onClose={() => setShowAddAgentModal(false)}
        />
      )}
    </div>
  );
}
