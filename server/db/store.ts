import bcrypt from 'bcryptjs';
import { query, checkDbHealth } from './pool.ts';

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
  created_at: string;
}

export interface User {
  id: number;
  org_id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'agent' | 'operator' | 'customer';
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Router {
  id: number;
  org_id: number;
  name: string;
  platform: 'mikrotik' | 'hybrid';
  ip_address: string;
  api_port: number;
  rest_port: number;
  username: string;
  password_encrypted?: string;
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
  created_at: string;
  updated_at: string;
}

export interface OmadaController {
  id: number;
  org_id: number;
  name: string;
  url: string;
  api_version: string;
  operator_id: string;
  client_id?: string;
  client_secret?: string;
  site_id: string;
  site_name: string;
  status: 'online' | 'offline' | 'syncing';
  last_sync: string | null;
  total_devices: number;
  total_clients: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OmadaDevice {
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
  created_at: string;
}

export interface HotspotProfile {
  id: number;
  org_id: number;
  name: string;
  target_platform: 'mikrotik' | 'omada' | 'both';
  rate_limit_rx: string;
  rate_limit_tx: string;
  data_limit_mb: number; // 0 for unlimited
  shared_users: number;
  session_timeout_min: number;
  validity_days: number;
  price_tzs: number;
  description?: string;
  is_active: boolean;
  created_at: string;
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
  generated_by: number | null;
  activated_at: string | null;
  expires_at: string | null;
  mac_address: string | null;
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
  connection_type: 'hotspot' | 'pppoe' | 'static';
  status: 'active' | 'suspended' | 'expired';
  mac_address?: string;
  ip_address?: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  org_id: number;
  customer_id: number;
  profile_id: number | null;
  router_id: number | null;
  controller_id: number | null;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'provisioning_failed';
  last_provisioned_at: string;
  created_at: string;
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
  customer_id?: number | null;
  voucher_id?: number | null;
  profile_id?: number | null;
  retry_count: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ProvisioningJob {
  id: number;
  org_id: number;
  transaction_id: number | null;
  target_type: 'mikrotik' | 'omada' | 'radius';
  target_id: number;
  payload: any;
  status: 'pending' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

export interface Notification {
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
  created_at: string;
}

export interface RouterHeartbeat {
  id: number;
  org_id: number;
  router_id: number;
  status: string;
  cpu_load: number;
  free_memory_mb: number;
  active_sessions: number;
  ip_reported: string;
  latency_ms: number;
  recorded_at: string;
}

export interface AuditLog {
  id: number;
  org_id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export interface RadCheck {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadReply {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadAcct {
  radacctid: number;
  acctsessionid: string;
  acctuniqueid: string;
  username: string;
  nasipaddress: string;
  nasportid?: string;
  acctstarttime: string;
  acctstoptime?: string;
  acctsessiontime: number;
  acctinputoctets: number;
  acctoutputoctets: number;
  calledstationid?: string;
  callingstationid?: string;
  framedipaddress?: string;
}

export interface NasClient {
  id: number;
  nasname: string;
  shortname: string;
  type: string;
  ports?: number;
  secret: string;
  description: string;
}

// Memory Store for high-performance resilience & multi-tenant operations
class DataStore {
  organizations: Organization[] = [];
  users: User[] = [];
  routers: Router[] = [];
  omadaControllers: OmadaController[] = [];
  omadaDevices: OmadaDevice[] = [];
  profiles: HotspotProfile[] = [];
  vouchers: Voucher[] = [];
  customers: Customer[] = [];
  subscriptions: Subscription[] = [];
  transactions: Transaction[] = [];
  provisioningJobs: ProvisioningJob[] = [];
  notifications: Notification[] = [];
  agents: Agent[] = [];
  heartbeats: RouterHeartbeat[] = [];
  auditLogs: AuditLog[] = [];
  radcheck: RadCheck[] = [];
  radreply: RadReply[] = [];
  radacct: RadAcct[] = [];
  nas: NasClient[] = [];

  private isSeeded = false;

  async init() {
    if (this.isSeeded) return;
    this.seedDefaultData();
    this.isSeeded = true;
  }

  private seedDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@NetPulse2025!', salt);
    const agentHash = bcrypt.hashSync('AgentPass123!', salt);
    const now = new Date().toISOString();

    // 1. Default Organization
    this.organizations = [
      {
        id: 1,
        name: 'FastNet ISP & Hotspots Tanzania',
        slug: 'fastnet-tz',
        domain: 'fastnet.co.tz',
        contact_email: 'noc@fastnet.co.tz',
        contact_phone: '+255 22 211 4455',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        is_active: true,
        created_at: now,
      },
      {
        id: 2,
        name: 'Kilimanjaro Wireless Networks',
        slug: 'kilinet',
        domain: 'kilinet.co.tz',
        contact_email: 'support@kilinet.co.tz',
        contact_phone: '+255 27 275 8899',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        is_active: true,
        created_at: now,
      },
    ];

    // 2. Default Users
    this.users = [
      {
        id: 1,
        org_id: 1,
        username: 'admin',
        email: 'admin@xcloud.co.tz',
        password_hash: adminHash,
        full_name: 'Chief Network Engineer',
        role: 'superadmin',
        phone: '+255 754 000 001',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        org_id: 1,
        username: 'daresalaam_agent',
        email: 'agent.kariakoo@fastnet.co.tz',
        password_hash: agentHash,
        full_name: 'Kariakoo Telecom Point',
        role: 'agent',
        phone: '+255 768 111 222',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        org_id: 1,
        username: 'noc_operator',
        email: 'noc@fastnet.co.tz',
        password_hash: adminHash,
        full_name: 'NOC Shift Supervisor',
        role: 'operator',
        phone: '+255 784 333 444',
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    ];

    // 3. MikroTik Routers
    this.routers = [
      {
        id: 1,
        org_id: 1,
        name: 'MikroTik CCR2004 - Dar es Salaam HQ',
        platform: 'mikrotik',
        ip_address: '197.250.12.10',
        api_port: 8728,
        rest_port: 443,
        username: 'api_user',
        password_encrypted: 'secure_ros_pass_v7',
        status: 'online',
        last_seen: new Date(Date.now() - 35000).toISOString(),
        wireguard_ip: '10.88.0.2',
        wireguard_public_key: 'h4d+0y0XUvP1Zk7W8tG2zH9eM6bY4mQ3kR1sN8vL5wE=',
        location: 'Kariakoo Hub, Dar es Salaam',
        model: 'MikroTik CCR2004-16G-2S+',
        ros_version: 'RouterOS v7.16.1',
        uptime: '42d 16h 28m',
        cpu_load: 18,
        free_memory_mb: 3420,
        total_memory_mb: 4096,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        org_id: 1,
        name: 'MikroTik RB4011 - Arusha ClockTower',
        platform: 'mikrotik',
        ip_address: '197.250.18.45',
        api_port: 8728,
        rest_port: 443,
        username: 'api_user',
        password_encrypted: 'secure_ros_pass_v7',
        status: 'online',
        last_seen: new Date(Date.now() - 48000).toISOString(),
        wireguard_ip: '10.88.0.3',
        wireguard_public_key: 'm3P9+k2R1sN8vL5wEh4d0y0XUvP1Zk7W8tG2zH9eM6b=',
        location: 'Clock Tower CBD, Arusha',
        model: 'MikroTik RB4011iGS+RM',
        ros_version: 'RouterOS v7.15.3',
        uptime: '18d 04h 12m',
        cpu_load: 32,
        free_memory_mb: 680,
        total_memory_mb: 1024,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        org_id: 1,
        name: 'MikroTik hEX S - Mwanza Rock City',
        platform: 'mikrotik',
        ip_address: '197.250.22.90',
        api_port: 8728,
        rest_port: 443,
        username: 'api_user',
        password_encrypted: 'secure_ros_pass_v7',
        status: 'online',
        last_seen: new Date(Date.now() - 72000).toISOString(),
        wireguard_ip: '10.88.0.4',
        wireguard_public_key: 'q9K7wE1sN8vL5wEh4d0y0XUvP1Zk7W8tG2zH9eM6bY4=',
        location: 'Capri Point, Mwanza',
        model: 'MikroTik RB760iGS (hEX S)',
        ros_version: 'RouterOS v7.14.2',
        uptime: '9d 19h 45m',
        cpu_load: 24,
        free_memory_mb: 184,
        total_memory_mb: 256,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      }
    ];

    // 4. TP-Link Omada Controllers
    this.omadaControllers = [
      {
        id: 1,
        org_id: 1,
        name: 'Omada OC200 - Slipway Waterfront Hotel',
        url: 'https://omada.slipway.co.tz:8043',
        api_version: 'v2',
        operator_id: 'admin',
        client_secret: 'omada_secret_2025',
        site_id: 'site_slipway_01',
        site_name: 'Slipway Waterfront',
        status: 'online',
        last_sync: new Date(Date.now() - 60000).toISOString(),
        total_devices: 6,
        total_clients: 142,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        org_id: 1,
        name: 'Omada Cloud Controller - Mlimani City Mall',
        url: 'https://omada.mlimanicity.co.tz:8043',
        api_version: 'v2',
        operator_id: 'admin',
        client_secret: 'omada_secret_2025',
        site_id: 'site_mlimani_02',
        site_name: 'Mlimani City Mall',
        status: 'online',
        last_sync: new Date(Date.now() - 120000).toISOString(),
        total_devices: 18,
        total_clients: 380,
        is_enabled: true,
        created_at: now,
        updated_at: now,
      }
    ];

    // 5. TP-Link Omada Devices
    this.omadaDevices = [
      {
        id: 1,
        org_id: 1,
        controller_id: 1,
        mac: '54-AF-97-11-22-33',
        name: 'Core Gateway ER7206',
        model: 'TL-ER7206 v1.0',
        type: 'gateway',
        ip: '192.168.10.1',
        status: 'connected',
        version: 'v1.4.1',
        client_count: 142,
        created_at: now,
      },
      {
        id: 2,
        org_id: 1,
        controller_id: 1,
        mac: '54-AF-97-44-55-66',
        name: 'JetStream 24P PoE+ Switch',
        model: 'TL-SG3428MP v3.0',
        type: 'switch',
        ip: '192.168.10.2',
        status: 'connected',
        version: 'v3.0.4',
        client_count: 24,
        created_at: now,
      },
      {
        id: 3,
        org_id: 1,
        controller_id: 1,
        mac: '54-AF-97-77-88-99',
        name: 'EAP650 Ceiling AP - Lobby',
        model: 'EAP650(EU) v1.0',
        type: 'ap',
        ip: '192.168.10.21',
        status: 'connected',
        version: 'v1.0.6',
        client_count: 48,
        created_at: now,
      },
      {
        id: 4,
        org_id: 1,
        controller_id: 1,
        mac: '54-AF-97-AA-BB-CC',
        name: 'EAP610-Outdoor - Deck',
        model: 'EAP610-Outdoor v1.0',
        type: 'ap',
        ip: '192.168.10.22',
        status: 'connected',
        version: 'v1.1.2',
        client_count: 36,
        created_at: now,
      }
    ];

    // 6. Plans & Bandwidth Packages
    this.profiles = [
      {
        id: 1,
        org_id: 1,
        name: '1 Hour Fast (1,000 TZS)',
        target_platform: 'both',
        rate_limit_rx: '5M',
        rate_limit_tx: '5M',
        data_limit_mb: 0,
        shared_users: 1,
        session_timeout_min: 60,
        validity_days: 1,
        price_tzs: 1000,
        description: 'High speed internet valid for 1 hour from first login. Supported on MikroTik and Omada.',
        is_active: true,
        created_at: now,
      },
      {
        id: 2,
        org_id: 1,
        name: '3 Hours Boost (2,000 TZS)',
        target_platform: 'both',
        rate_limit_rx: '8M',
        rate_limit_tx: '8M',
        data_limit_mb: 0,
        shared_users: 1,
        session_timeout_min: 180,
        validity_days: 1,
        price_tzs: 2000,
        description: '8 Mbps turbo speed valid for 3 hours of continuous surfing',
        is_active: true,
        created_at: now,
      },
      {
        id: 3,
        org_id: 1,
        name: '24 Hours Daily (3,500 TZS)',
        target_platform: 'both',
        rate_limit_rx: '10M',
        rate_limit_tx: '10M',
        data_limit_mb: 0,
        shared_users: 2,
        session_timeout_min: 1440,
        validity_days: 1,
        price_tzs: 3500,
        description: '24 hours unlimited access with up to 2 simultaneous devices',
        is_active: true,
        created_at: now,
      },
      {
        id: 4,
        org_id: 1,
        name: '7 Days Weekly Unlimited (15,000 TZS)',
        target_platform: 'both',
        rate_limit_rx: '15M',
        rate_limit_tx: '15M',
        data_limit_mb: 0,
        shared_users: 2,
        session_timeout_min: 10080,
        validity_days: 7,
        price_tzs: 15000,
        description: '7 full days of uninterrupted broadband hotspot access',
        is_active: true,
        created_at: now,
      },
      {
        id: 5,
        org_id: 1,
        name: '30 Days Monthly Pro (45,000 TZS)',
        target_platform: 'both',
        rate_limit_rx: '25M',
        rate_limit_tx: '25M',
        data_limit_mb: 0,
        shared_users: 3,
        session_timeout_min: 43200,
        validity_days: 30,
        price_tzs: 45000,
        description: 'Premium uncapped 25 Mbps broadband for homes, hotels, and offices',
        is_active: true,
        created_at: now,
      }
    ];

    // 7. Vouchers
    const sampleVouchers = [
      { code: 'DAR-77491', pass: '8831', profileId: 1, price: 1000 },
      { code: 'DAR-88204', pass: '4492', profileId: 1, price: 1000 },
      { code: 'DAR-31958', pass: '9912', profileId: 2, price: 2000 },
      { code: 'ARU-49210', pass: '7721', profileId: 3, price: 3500 },
      { code: 'MWA-90142', pass: '3318', profileId: 4, price: 15000 },
      { code: 'PRO-10943', pass: '5529', profileId: 5, price: 45000 },
    ];

    this.vouchers = sampleVouchers.map((v, i) => ({
      id: i + 1,
      org_id: 1,
      code: v.code,
      password: v.pass,
      profile_id: v.profileId,
      router_id: 1,
      controller_id: null,
      agent_id: 1,
      status: 'active',
      price_tzs: v.price,
      batch_id: 'BATCH-2025-01',
      generated_by: 1,
      activated_at: null,
      expires_at: null,
      mac_address: null,
      created_at: now,
    }));

    // Sync to FreeRADIUS
    this.vouchers.forEach((v) => {
      this.radcheck.push({
        id: this.radcheck.length + 1,
        username: v.code,
        attribute: 'Cleartext-Password',
        op: ':=',
        value: v.password,
      });
      this.radreply.push({
        id: this.radreply.length + 1,
        username: v.code,
        attribute: 'Mikrotik-Rate-Limit',
        op: '=',
        value: '5M/5M',
      });
    });

    // 8. Customers
    this.customers = [
      {
        id: 1,
        org_id: 1,
        username: 'john.massawe',
        full_name: 'John E. Massawe',
        phone: '+255 754 889 123',
        email: 'massawe.john@gmail.com',
        balance_tzs: 15000,
        profile_id: 3,
        connection_type: 'hotspot',
        status: 'active',
        mac_address: '4C:34:88:A1:B2:C3',
        ip_address: '10.5.50.142',
        created_at: now,
      },
      {
        id: 2,
        org_id: 1,
        username: 'amina.bakari',
        full_name: 'Amina Bakari Ally',
        phone: '+255 713 445 678',
        email: 'amina.ally@yahoo.com',
        balance_tzs: 45000,
        profile_id: 5,
        connection_type: 'pppoe',
        status: 'active',
        mac_address: 'AC:87:A3:11:44:99',
        ip_address: '10.10.100.22',
        created_at: now,
      }
    ];

    // 9. Subscriptions
    this.subscriptions = [
      {
        id: 1,
        org_id: 1,
        customer_id: 1,
        profile_id: 3,
        router_id: 1,
        controller_id: null,
        start_date: new Date(Date.now() - 86400000).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 6).toISOString(),
        auto_renew: true,
        status: 'active',
        last_provisioned_at: now,
        created_at: now,
      },
      {
        id: 2,
        org_id: 1,
        customer_id: 2,
        profile_id: 5,
        router_id: 1,
        controller_id: null,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 15).toISOString(),
        auto_renew: true,
        status: 'active',
        last_provisioned_at: now,
        created_at: now,
      }
    ];

    // 10. Reseller Agents
    this.agents = [
      {
        id: 1,
        org_id: 1,
        user_id: 2,
        business_name: 'Kariakoo Telecom & Tech Point',
        phone: '+255 768 111 222',
        float_balance_tzs: 180000,
        commission_percent: 10.00,
        location: 'Swahili St, Kariakoo, Dar es Salaam',
        status: 'active',
        created_at: now,
      }
    ];

    // 11. Transactions
    this.transactions = [
      {
        id: 1,
        org_id: 1,
        reference: 'TXN-TZ-98214',
        external_reference: 'MPESA-9918237190',
        provider: 'vodacom_mpesa',
        phone_number: '255754889123',
        amount_tzs: 3500,
        fee_tzs: 70,
        type: 'voucher_purchase',
        status: 'completed',
        provisioning_status: 'provisioned',
        customer_id: 1,
        voucher_id: 4,
        profile_id: 3,
        retry_count: 0,
        metadata: { channel: 'USSD_STK_PUSH', plan: '24 Hours Daily' },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        org_id: 1,
        reference: 'TXN-TZ-98215',
        external_reference: 'TIGO-882736152',
        provider: 'tigo_pesa',
        phone_number: '255713445678',
        amount_tzs: 45000,
        fee_tzs: 900,
        type: 'account_topup',
        status: 'completed',
        provisioning_status: 'provisioned',
        customer_id: 2,
        voucher_id: null,
        profile_id: 5,
        retry_count: 0,
        metadata: { channel: 'Biller_API', plan: '30 Days Monthly Pro' },
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 3,
        org_id: 1,
        reference: 'TXN-TZ-98216',
        external_reference: 'AIRTEL-7721839',
        provider: 'airtel_money',
        phone_number: '255784333444',
        amount_tzs: 100000,
        fee_tzs: 2000,
        type: 'agent_float',
        status: 'completed',
        provisioning_status: 'provisioned',
        customer_id: null,
        voucher_id: null,
        profile_id: null,
        retry_count: 0,
        metadata: { agent_id: 1, agent_name: 'Kariakoo Telecom' },
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 4,
        org_id: 1,
        reference: 'TXN-TZ-98217',
        external_reference: 'AZAM-441298',
        provider: 'azampay',
        phone_number: '255688992211',
        amount_tzs: 1000,
        fee_tzs: 25,
        type: 'voucher_purchase',
        status: 'completed',
        provisioning_status: 'provisioned',
        customer_id: null,
        voucher_id: 1,
        profile_id: 1,
        retry_count: 0,
        metadata: { aggregator: 'AzamPay Checkout' },
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      }
    ];

    // 12. Notifications
    this.notifications = [
      {
        id: 1,
        org_id: 1,
        type: 'payment',
        title: 'M-Pesa Payment Received',
        message: 'Payment of 3,500 TZS received from 255754889123. Voucher ARU-49210 issued & provisioned.',
        severity: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 2,
        org_id: 1,
        type: 'system',
        title: 'Omada Controller Synchronized',
        message: 'Slipway Waterfront Controller OC200 synchronized with 6 adopted devices and 142 clients.',
        severity: 'info',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ];

    // 13. Router Heartbeats
    this.heartbeats = [
      {
        id: 1,
        org_id: 1,
        router_id: 1,
        status: 'online',
        cpu_load: 18,
        free_memory_mb: 3420,
        active_sessions: 47,
        ip_reported: '197.250.12.10',
        latency_ms: 14,
        recorded_at: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: 2,
        org_id: 1,
        router_id: 2,
        status: 'online',
        cpu_load: 32,
        free_memory_mb: 680,
        active_sessions: 28,
        ip_reported: '197.250.18.45',
        latency_ms: 22,
        recorded_at: new Date(Date.now() - 60000).toISOString(),
      }
    ];

    // 14. Audit Logs
    this.auditLogs = [
      {
        id: 1,
        org_id: 1,
        user_id: 1,
        action: 'CONTROLLER_INITIALIZED',
        entity_type: 'omada',
        entity_id: '1',
        details: { name: 'Omada OC200 - Slipway Waterfront' },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        org_id: 1,
        user_id: 1,
        action: 'ROUTER_INITIALIZED',
        entity_type: 'router',
        entity_id: '1',
        details: { name: 'MikroTik CCR2004 - Dar es Salaam HQ' },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ];

    // 15. NAS Clients
    this.nas = [
      {
        id: 1,
        nasname: '10.88.0.2',
        shortname: 'mikrotik-dar-ccr',
        type: 'mikrotik',
        ports: 1812,
        secret: 'Testing123-XCLOUD-RADIUS-Secret',
        description: 'MikroTik CCR2004 Dar es Salaam WireGuard NAS',
      },
      {
        id: 2,
        nasname: '10.88.0.3',
        shortname: 'mikrotik-arusha-rb',
        type: 'mikrotik',
        ports: 1812,
        secret: 'Testing123-XCLOUD-RADIUS-Secret',
        description: 'MikroTik RB4011 Arusha WireGuard NAS',
      },
      {
        id: 3,
        nasname: '10.88.0.10',
        shortname: 'omada-oc200-slipway',
        type: 'other',
        ports: 1812,
        secret: 'Testing123-XCLOUD-RADIUS-Secret',
        description: 'Omada OC200 Controller Captive Portal NAS',
      }
    ];
  }
}

export const store = new DataStore();
store.init();
