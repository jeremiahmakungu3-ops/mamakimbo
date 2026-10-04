-- ==============================================================================
-- XCLOUD Multi-Tenant Production Database Schema (PostgreSQL & FreeRADIUS)
-- ==============================================================================

-- 1. Organizations / Tenants
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(64) UNIQUE NOT NULL,
  domain VARCHAR(128),
  contact_email VARCHAR(128),
  contact_phone VARCHAR(32),
  currency VARCHAR(8) DEFAULT 'TZS',
  timezone VARCHAR(64) DEFAULT 'Africa/Dar_es_Salaam',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);

-- 2. Users (Multi-tenant with RBAC)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'operator', -- superadmin, org_admin, operator, agent, customer
  phone VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. MikroTik Routers
CREATE TABLE IF NOT EXISTS routers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'mikrotik', -- mikrotik, hybrid
  ip_address VARCHAR(128) NOT NULL,
  api_port INTEGER DEFAULT 8728,
  rest_port INTEGER DEFAULT 443,
  username VARCHAR(64) NOT NULL DEFAULT 'admin',
  password_encrypted VARCHAR(255),
  status VARCHAR(32) DEFAULT 'offline', -- online, offline, provisioning
  last_seen TIMESTAMP WITH TIME ZONE,
  wireguard_ip VARCHAR(64),
  wireguard_public_key VARCHAR(128),
  location VARCHAR(128),
  model VARCHAR(64),
  ros_version VARCHAR(32),
  uptime VARCHAR(64),
  cpu_load INTEGER DEFAULT 0,
  free_memory_mb INTEGER DEFAULT 0,
  total_memory_mb INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_routers_org ON routers(org_id);
CREATE INDEX IF NOT EXISTS idx_routers_status ON routers(status);

-- 4. TP-Link Omada Controllers
CREATE TABLE IF NOT EXISTS omada_controllers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  url VARCHAR(255) NOT NULL,
  api_version VARCHAR(16) DEFAULT 'v2',
  operator_id VARCHAR(64) DEFAULT 'admin',
  client_id VARCHAR(128),
  client_secret VARCHAR(255),
  site_id VARCHAR(128) DEFAULT 'default',
  site_name VARCHAR(128) DEFAULT 'Default Site',
  status VARCHAR(32) DEFAULT 'offline', -- online, offline, syncing
  last_sync TIMESTAMP WITH TIME ZONE,
  total_devices INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_omada_org ON omada_controllers(org_id);

-- 5. TP-Link Omada Devices
CREATE TABLE IF NOT EXISTS omada_devices (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  controller_id INTEGER REFERENCES omada_controllers(id) ON DELETE CASCADE,
  mac VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  model VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL, -- gateway, switch, ap
  ip VARCHAR(64),
  status VARCHAR(32) DEFAULT 'connected',
  version VARCHAR(64),
  client_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_omada_devices_ctrl ON omada_devices(controller_id);

-- 6. Plans & Bandwidth Packages
CREATE TABLE IF NOT EXISTS hotspot_profiles (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  target_platform VARCHAR(32) NOT NULL DEFAULT 'both', -- mikrotik, omada, both
  rate_limit_rx VARCHAR(32) DEFAULT '5M',
  rate_limit_tx VARCHAR(32) DEFAULT '5M',
  data_limit_mb BIGINT DEFAULT 0, -- 0 for unlimited
  shared_users INTEGER DEFAULT 1,
  session_timeout_min INTEGER DEFAULT 60,
  validity_days INTEGER DEFAULT 1,
  price_tzs INTEGER DEFAULT 1000,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON hotspot_profiles(org_id);

-- 7. Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  password VARCHAR(64) NOT NULL,
  profile_id INTEGER REFERENCES hotspot_profiles(id) ON DELETE SET NULL,
  router_id INTEGER REFERENCES routers(id) ON DELETE SET NULL,
  controller_id INTEGER REFERENCES omada_controllers(id) ON DELETE SET NULL,
  agent_id INTEGER,
  status VARCHAR(32) DEFAULT 'active', -- active, used, expired, revoked
  price_tzs INTEGER NOT NULL,
  batch_id VARCHAR(64),
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  mac_address VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vouchers_org ON vouchers(org_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);

-- 8. Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  username VARCHAR(64) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(128),
  balance_tzs INTEGER DEFAULT 0,
  profile_id INTEGER REFERENCES hotspot_profiles(id) ON DELETE SET NULL,
  connection_type VARCHAR(32) DEFAULT 'hotspot', -- hotspot, pppoe, static
  status VARCHAR(32) DEFAULT 'active',
  mac_address VARCHAR(64),
  ip_address VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 9. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES hotspot_profiles(id) ON DELETE SET NULL,
  router_id INTEGER REFERENCES routers(id) ON DELETE SET NULL,
  controller_id INTEGER REFERENCES omada_controllers(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  status VARCHAR(32) DEFAULT 'active', -- active, expired, cancelled, provisioning_failed
  last_provisioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id);

-- 10. Reseller Agents
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  float_balance_tzs INTEGER DEFAULT 0,
  commission_percent NUMERIC(5,2) DEFAULT 10.00,
  location VARCHAR(128),
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(org_id);

-- 11. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  reference VARCHAR(64) UNIQUE NOT NULL,
  external_reference VARCHAR(128),
  provider VARCHAR(32) NOT NULL, -- vodacom_mpesa, tigo_pesa, airtel_money, azampay, agent_cash
  phone_number VARCHAR(32) NOT NULL,
  amount_tzs INTEGER NOT NULL,
  fee_tzs INTEGER DEFAULT 0,
  type VARCHAR(32) NOT NULL, -- voucher_purchase, account_topup, subscription_renewal, agent_float
  status VARCHAR(32) NOT NULL, -- pending, completed, failed, reversed
  provisioning_status VARCHAR(32) DEFAULT 'pending', -- pending, provisioned, provisioning_failed, retrying
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  voucher_id INTEGER REFERENCES vouchers(id) ON DELETE SET NULL,
  profile_id INTEGER REFERENCES hotspot_profiles(id) ON DELETE SET NULL,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_org ON transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_ref ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);

-- 12. Provisioning Jobs (Background Queue for MikroTik/Omada retry)
CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  target_type VARCHAR(32) NOT NULL, -- mikrotik, omada, radius
  target_id INTEGER NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(32) DEFAULT 'pending', -- pending, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  error_message TEXT,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prov_jobs_status ON provisioning_jobs(status);

-- 13. Notifications & Alerts
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL, -- payment, device_offline, voucher_low, provisioning_failed, system
  title VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(16) DEFAULT 'info', -- info, warning, error
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_org ON notifications(org_id);

-- 14. Router Heartbeats
CREATE TABLE IF NOT EXISTS router_heartbeats (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  router_id INTEGER REFERENCES routers(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  cpu_load INTEGER,
  free_memory_mb INTEGER,
  active_sessions INTEGER,
  ip_reported VARCHAR(64),
  latency_ms INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_heartbeats_router ON router_heartbeats(router_id);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64),
  details JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id);

-- ==========================================
-- Standard FreeRADIUS RFC-Compliant Tables
-- ==========================================
CREATE TABLE IF NOT EXISTS radcheck (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT 'Cleartext-Password',
  op VARCHAR(2) NOT NULL DEFAULT ':=',
  value VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radcheck_username_idx ON radcheck(username);

CREATE TABLE IF NOT EXISTS radreply (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  attribute VARCHAR(64) NOT NULL DEFAULT '',
  op VARCHAR(2) NOT NULL DEFAULT '=',
  value VARCHAR(253) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radreply_username_idx ON radreply(username);

CREATE TABLE IF NOT EXISTS radacct (
  radacctid BIGSERIAL PRIMARY KEY,
  acctsessionid VARCHAR(64) NOT NULL DEFAULT '',
  acctuniqueid VARCHAR(32) UNIQUE NOT NULL DEFAULT '',
  username VARCHAR(64) NOT NULL DEFAULT '',
  groupname VARCHAR(64) NOT NULL DEFAULT '',
  realm VARCHAR(64) DEFAULT '',
  nasipaddress VARCHAR(45) NOT NULL DEFAULT '',
  nasportid VARCHAR(32) DEFAULT NULL,
  nasporttype VARCHAR(32) DEFAULT NULL,
  acctstarttime TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  acctupdatetime TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  acctstoptime TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  acctinterval INTEGER DEFAULT NULL,
  acctsessiontime BIGINT DEFAULT NULL,
  acctauthentic VARCHAR(32) DEFAULT NULL,
  connectinfo_start VARCHAR(50) DEFAULT NULL,
  connectinfo_stop VARCHAR(50) DEFAULT NULL,
  acctinputoctets BIGINT DEFAULT 0,
  acctoutputoctets BIGINT DEFAULT 0,
  calledstationid VARCHAR(50) NOT NULL DEFAULT '',
  callingstationid VARCHAR(50) NOT NULL DEFAULT '',
  acctterminatecause VARCHAR(32) NOT NULL DEFAULT '',
  servicetype VARCHAR(32) DEFAULT NULL,
  framedprotocol VARCHAR(32) DEFAULT NULL,
  framedipaddress VARCHAR(45) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS radacct_username_idx ON radacct(username);
CREATE INDEX IF NOT EXISTS radacct_session_idx ON radacct(acctsessionid);

CREATE TABLE IF NOT EXISTS nas (
  id SERIAL PRIMARY KEY,
  nasname VARCHAR(128) NOT NULL,
  shortname VARCHAR(64),
  type VARCHAR(30) DEFAULT 'other',
  ports INTEGER,
  secret VARCHAR(60) NOT NULL,
  server VARCHAR(64),
  community VARCHAR(50),
  description VARCHAR(200) DEFAULT 'NAS Client'
);
