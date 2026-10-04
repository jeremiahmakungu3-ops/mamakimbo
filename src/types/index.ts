export interface Organization {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  contact_email?: string;
  contact_phone?: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at?: string;
  stats?: {
    routers: number;
    controllers: number;
    customers: number;
    activeVouchers: number;
  };
}

export interface User {
  id: number;
  org_id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'agent' | 'operator' | 'customer';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface RouterItem {
  id: number;
  org_id: number;
  name: string;
  platform: 'mikrotik' | 'hybrid';
  ip_address: string;
  api_port: number;
  rest_port: number;
  username: string;
  status: 'online' | 'offline' | 'provisioning';
  last_seen: string | null;
  wireguard_ip?: string;
  wireguard_public_key?: string;
  location?: string;
  model?: string;
  ros_version?: string;
  uptime?: string;
  cpu_load: number;
  free_memory_mb: number;
  total_memory_mb: number;
  is_enabled: boolean;
  hasPassword?: boolean;
}

export interface OmadaControllerItem {
  id: number;
  org_id: number;
  name: string;
  url: string;
  api_version: string;
  operator_id: string;
  site_id: string;
  site_name: string;
  status: 'online' | 'offline' | 'syncing';
  last_sync: string | null;
  total_devices: number;
  total_clients: number;
  is_enabled: boolean;
}

export interface OmadaDeviceItem {
  id: number;
  org_id: number;
  controller_id: number;
  mac: string;
  name: string;
  model: string;
  type: 'gateway' | 'switch' | 'ap';
  ip: string;
  status: string;
  version: string;
  client_count: number;
  clientCount?: number;
}

export interface HotspotProfile {
  id: number;
  org_id: number;
  name: string;
  target_platform: 'mikrotik' | 'omada' | 'both';
  rate_limit_rx: string;
  rate_limit_tx: string;
  data_limit_mb: number;
  shared_users: number;
  session_timeout_min: number;
  validity_days: number;
  price_tzs: number;
  description?: string;
  is_active: boolean;
}

export interface Voucher {
  id: number;
  org_id: number;
  code: string;
  password: string;
  profile_id: number;
  router_id: number | null;
  controller_id: number | null;
  agent_id: number | null;
  status: 'active' | 'used' | 'expired' | 'revoked';
  price_tzs: number;
  batch_id: string;
  profileName?: string;
  rateLimit?: string;
  routerName?: string;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  org_id: number;
  username: string;
  full_name: string;
  phone: string;
  email?: string;
  balance_tzs: number;
  profile_id: number | null;
  profileName?: string;
  rateLimit?: string;
  connection_type: 'hotspot' | 'pppoe' | 'static';
  status: 'active' | 'suspended' | 'expired';
  created_at: string;
}

export interface SubscriptionItem {
  id: number;
  org_id: number;
  customer_id: number;
  profile_id: number | null;
  router_id: number | null;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'provisioning_failed';
  last_provisioned_at: string;
  customerName?: string;
  customerPhone?: string;
  planName?: string;
  rateLimit?: string;
  routerName?: string;
}

export interface Transaction {
  id: number;
  org_id: number;
  reference: string;
  external_reference?: string;
  provider: 'vodacom_mpesa' | 'tigo_pesa' | 'airtel_money' | 'azampay' | 'agent_cash';
  phone_number: string;
  amount_tzs: number;
  fee_tzs: number;
  type: 'voucher_purchase' | 'account_topup' | 'subscription_renewal' | 'agent_float';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  provisioning_status: 'pending' | 'provisioned' | 'provisioning_failed' | 'retrying';
  retry_count?: number;
  metadata?: any;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  org_id: number;
  type: 'payment' | 'device_offline' | 'voucher_low' | 'provisioning_failed' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface Agent {
  id: number;
  org_id: number;
  user_id: number;
  business_name: string;
  phone: string;
  float_balance_tzs: number;
  commission_percent: number;
  location?: string;
  status: 'active' | 'suspended';
  fullName?: string;
  vouchersIssuedCount?: number;
  vouchersSoldCount?: number;
  totalSoldTzs?: number;
  commissionEarnedTzs?: number;
}

export interface ActiveSession {
  id: string;
  server: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  sessionTimeLeft?: string;
}

export interface HardwarePort {
  id: string;
  label: string;
  role: string;
  recommended: string;
}

export interface HardwareModel {
  id: string;
  name: string;
  vendor: string;
  category: string;
  ports: HardwarePort[];
  defaultIp: string;
  defaultUser: string;
  powerReq: string;
}

export interface HealthCheckResponse {
  status: string;
  uptimeSeconds: number;
  service: string;
  version: string;
  cloudRun: {
    port: number;
    service: string;
    revision: string;
  };
  database: {
    status: string;
    message?: string;
    latencyMs?: number;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
  };
  config?: {
    publicAppUrl: string;
    apiUrl: string;
    webhookUrl: string;
  };
}
