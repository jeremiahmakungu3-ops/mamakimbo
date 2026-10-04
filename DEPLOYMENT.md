# XCLOUD Multi-Tenant ISP & Hotspot Controller
## Real Production Deployment Guide for Google Cloud Run

This guide details the complete, step-by-step production rollout for **XCLOUD** on **Google Cloud Run** with Cloud SQL (PostgreSQL), Google Secret Manager, WireGuard VPN Tunneling, FreeRADIUS AAA, MikroTik RouterOS API, TP-Link Omada Controller, and Tanzania Mobile Money Payment Gateways (Vodacom M-Pesa, Tigo Pesa, Airtel Money, AzamPay).

---

## 1. Final Project Architecture & Directory Structure

```
├── .dockerignore                     # Docker build exclusion rules
├── .env.example                      # Production environment variables specification
├── DEPLOYMENT.md                     # Comprehensive Cloud Run deployment & ops manual
├── Dockerfile                        # Multi-stage production container build
├── index.html                        # Production HTML entry point with metadata sync
├── metadata.json                     # Applet identity and capabilities
├── package.json                      # Full-stack dependencies & production scripts
├── tsconfig.json                     # TypeScript compiler configuration
├── vite.config.ts                    # Vite build & Tailwind CSS bundler config
│
├── migrations/                       # Production PostgreSQL DDL migrations
│   └── 001_initial_schema.sql        # Organizations, users, routers, omada, vouchers,
│                                     # subscriptions, transactions, jobs, audit, FreeRADIUS
│
├── server/                           # Server-side backend (Node.js/Express/TypeScript)
│   ├── db/
│   │   ├── migrations.ts             # Automated SQL migration runner on startup
│   │   ├── pool.ts                   # Resilient PostgreSQL pool (Cloud SQL & local)
│   │   └── store.ts                  # Multi-tenant data store, seeding, and typed models
│   ├── middleware/
│   │   ├── auth.ts                   # JWT verification, RBAC role-guards, token generation
│   │   └── security.ts               # Rate limiting, audit logging, header sanitation
│   ├── routes/
│   │   ├── agents.ts                 # Resellers, POS agents, commissions, float topup
│   │   ├── auth.ts                   # Login, register, profile, password change
│   │   ├── customers.ts              # Subscribers (Hotspot & PPPoE) CRUD & balances
│   │   ├── hotspot.ts                # Bandwidth plans, active sessions, IP bindings
│   │   ├── installation.ts           # Automatic & Manual Router/Omada installation wizard
│   │   ├── monitoring.ts             # ISP telemetry, heartbeats, revenue analytics
│   │   ├── notifications.ts          # Critical system alerts & device offline logs
│   │   ├── omada.ts                  # TP-Link Omada controller sync, devices & captive portal
│   │   ├── organizations.ts          # Multi-tenant isolation & organization settings
│   │   ├── payments.ts               # Tanzania Mobile Money STK Push, callbacks & retry
│   │   ├── radius.ts                 # FreeRADIUS rlm_rest auth, reply, & accounting
│   │   ├── reports.ts                # Financial breakdowns, operator and agent sales
│   │   ├── routers.ts                # MikroTik RouterOS REST/API, WireGuard, provisioning
│   │   ├── subscriptions.ts          # Recurring customer plan subscriptions & status
│   │   ├── transactions.ts           # Audited payment records & reconciliation
│   │   ├── users.ts                  # Multi-tenant staff management & RBAC assignments
│   │   └── vouchers.ts               # Batch voucher generator, export, and FreeRADIUS sync
│   └── services/
│       ├── mikrotik.ts               # RouterOS v7 REST API & classic API client
│       ├── omada.ts                  # TP-Link Omada OpenAPI controller client
│       ├── payments.ts               # Vodacom M-Pesa, Tigo, Airtel, AzamPay integration
│       ├── queue.ts                  # Robust background retry queue for hardware sync
│       ├── radius.ts                 # FreeRADIUS radcheck, radreply, & radacct synchronizer
│       ├── secrets.ts                # Google Cloud Secret Manager server-side resolver
│       └── wireguard.ts              # Curve25519 key generation & VPN router provisioning
│
├── server.ts                         # Express server entry point (PORT, Cloud Run, /health)
│
└── src/                              # Frontend (React 19, TypeScript, Tailwind CSS)
    ├── api/
    │   └── client.ts                 # Dynamic API client with Bearer auth & error handling
    ├── components/
    │   ├── AddAgentModal.tsx         # Register agent reseller modal
    │   ├── AddCustomerModal.tsx      # Add customer / subscriber modal
    │   ├── AddRouterModal.tsx        # Add MikroTik router modal
    │   ├── AgentsView.tsx            # POS reseller float & commission dashboard
    │   ├── CustomersView.tsx         # Customer directory & PPPoE accounts
    │   ├── DashboardOverview.tsx     # High-level ISP KPI dashboard & revenue metrics
    │   ├── DashboardPaymentTerminal.tsx # Instant C2B push payment terminal
    │   ├── GenerateVouchersModal.tsx # Batch voucher generation modal
    │   ├── InitiatePaymentModal.tsx  # Modal for mobile money collection
    │   ├── InstallationWizardView.tsx # Wiring diagrams & physical port connection wizard
    │   ├── LoginModal.tsx            # Authentication dialog
    │   ├── Navbar.tsx                # Organization switcher, alerts, user profile
    │   ├── NotificationsModal.tsx    # Live system alerts & offline warnings
    │   ├── OmadaView.tsx             # TP-Link Omada controller & device manager
    │   ├── PaymentsView.tsx          # Real-time transaction log & webhook monitor
    │   ├── ProvisionModal.tsx        # MikroTik 1-Click RouterOS script generator
    │   ├── RadiusView.tsx            # FreeRADIUS AAA monitoring & active sessions
    │   ├── ReportsView.tsx           # Financial revenue & voucher sales reports
    │   ├── RoutersView.tsx           # MikroTik router fleet status & heartbeat telemetry
    │   ├── Sidebar.tsx               # Enterprise module navigation
    │   ├── SubscriptionsView.tsx     # Customer plan subscriptions & expiration tracking
    │   ├── SystemHealthView.tsx      # Cloud Run, PostgreSQL & memory health probe
    │   ├── VoucherPrintModal.tsx     # Thermal printer & 8-per-page PDF voucher cards
    │   └── VouchersView.tsx          # Voucher inventory, filters & print actions
    ├── types/
    │   └── index.ts                  # Shared TypeScript interfaces & types
    ├── App.tsx                       # Main application layout, state orchestrator
    ├── index.css                     # Tailwind CSS styles & typography
    └── main.tsx                      # React root mounter
```

---

## 2. Required Production Environment Variables

Configure these in Google Cloud Run or Secret Manager. **Never commit production values to version control.**

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | **Yes** | `8080` | Port on which the server listens (automatically injected by Cloud Run). |
| `NODE_ENV` | **Yes** | `production` | Set to `production` for optimized static serving and security flags. |
| `PUBLIC_APP_URL` | **Yes** | `https://app.xcloud.co.tz` | Fully qualified domain URL of your application. |
| `API_URL` | No | `/api` | Base path for frontend API calls. |
| `WEBHOOK_URL` | No | `/api/payments/webhook` | Base path for mobile money webhooks. |
| `CORS_ORIGINS` | No | `https://app.xcloud.co.tz` | Comma-separated list of allowed CORS browser origins. |
| `JWT_SECRET` | **Yes** | *(Generate 64-char hex)* | Cryptographic key used to sign and verify user session tokens. |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiration period. |
| `PGHOST` | **Yes** | `/cloudsql/INSTANCE_NAME` | PostgreSQL host or Cloud SQL Unix domain socket. |
| `PGPORT` | No | `5432` | PostgreSQL port (5432). |
| `PGUSER` | **Yes** | `postgres` | PostgreSQL database user. |
| `PGPASSWORD` | **Yes** | *(Secret)* | PostgreSQL database password. |
| `PGDATABASE` | **Yes** | `xcloud_production` | PostgreSQL database name. |
| `DATABASE_URL` | No | *(Optional)* | Full PostgreSQL connection URI. Overrides separate PG* variables. |
| `GCP_PROJECT_ID` | No | *(Your GCP ID)* | Google Cloud Project ID for Google Secret Manager access. |
| `USE_SECRET_MANAGER`| No | `false` | Set to `true` to fetch secrets dynamically via Cloud Secret Manager. |
| `RADIUS_SECRET` | **Yes** | *(Secret)* | Shared secret key for FreeRADIUS NAS clients (MikroTik/Omada). |
| `RADIUS_DEFAULT_REALM`| No | `xcloud.local` | Default RADIUS authentication realm. |
| `RADIUS_AUTH_PORT` | No | `1812` | FreeRADIUS authentication UDP port. |
| `RADIUS_ACCT_PORT` | No | `1813` | FreeRADIUS accounting UDP port. |
| `WIREGUARD_SERVER_ENDPOINT` | No | `vpn.xcloud.co.tz:51820` | Central WireGuard VPN endpoint for remote routers. |
| `WIREGUARD_SERVER_PUBLIC_KEY` | No | *(Base64)* | Public key of the central WireGuard VPN server. |
| `WIREGUARD_SERVER_SUBNET` | No | `10.88.0.0/24` | Tunnel CIDR pool for assigned router VPN IPs. |
| `MPESA_API_KEY` | Optional | *(Vodacom Key)* | Vodacom Tanzania OpenAPI Bearer Token. |
| `MPESA_SERVICE_PROVIDER_CODE` | Optional | `000000` | Vodacom Shortcode / Till Number. |
| `TIGO_PESA_API_KEY` | Optional | *(Tigo Key)* | Tigo Pesa (Mixx by Yas) Merchant Key. |
| `TIGO_PESA_ACCOUNT_NUMBER` | Optional | `255710000000` | Tigo Pesa Merchant MSISDN. |
| `AIRTEL_MONEY_CLIENT_ID` | Optional | *(Airtel ID)* | Airtel Money Tanzania Client ID. |
| `AZAMPAY_CLIENT_ID` | Optional | *(Azam ID)* | AzamPay National Checkout Client ID. |
| `AZAMPAY_CLIENT_SECRET` | Optional | *(Azam Secret)* | AzamPay National Checkout Secret. |
| `AZAMPAY_WEBHOOK_SECRET` | Optional | *(Secret)* | HMAC-SHA256 signature secret for verifying incoming payment callbacks. |

---

## 3. Database Setup Steps (Cloud SQL PostgreSQL)

1. **Enable Cloud SQL Admin API**:
   ```bash
   gcloud services enable sqladmin.googleapis.com
   ```

2. **Create Cloud SQL PostgreSQL 16 Instance**:
   ```bash
   gcloud sql instances create xcloud-pg-db \
     --database-version=POSTGRES_16 \
     --tier=db-custom-2-7680 \
     --region=europe-west2 \
     --storage-type=SSD \
     --storage-size=25GB \
     --storage-auto-increase \
     --backup-start-time=02:00
   ```

3. **Create Database & Password**:
   ```bash
   gcloud sql databases create xcloud_production --instance=xcloud-pg-db
   gcloud sql users set-password postgres --instance=xcloud-pg-db --password="YOUR_STRONG_PASSWORD"
   ```

4. **Retrieve Cloud SQL Connection Name**:
   ```bash
   gcloud sql instances describe xcloud-pg-db --format="value(connectionName)"
   # Output format: PROJECT_ID:europe-west2:xcloud-pg-db
   ```

5. **Automated Schema Migrations**:
   The server automatically detects and executes `/migrations/001_initial_schema.sql` on startup. To inspect or run manually:
   ```bash
   psql -h localhost -U postgres -d xcloud_production -f migrations/001_initial_schema.sql
   ```

---

## 4. Google Secret Manager Setup

Store secrets securely outside source code and container images:

```bash
# 1. Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# 2. Store Secrets
echo -n "$(openssl rand -hex 32)" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "YOUR_STRONG_PASSWORD" | gcloud secrets create PGPASSWORD --data-file=-
echo -n "Testing123-XCLOUD-RADIUS-Secret" | gcloud secrets create RADIUS_SECRET --data-file=-
echo -n "YOUR_MPESA_API_KEY" | gcloud secrets create MPESA_API_KEY --data-file=-

# 3. Grant Service Account Access
PROJECT_NUM=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
for SECRET in JWT_SECRET PGPASSWORD RADIUS_SECRET MPESA_API_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 5. Cloud Run Deployment Steps

### Option A: Direct Build & Deploy via Google Cloud Build (Recommended)

```bash
gcloud run deploy xcloud-isp-controller \
  --source . \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 20 \
  --set-env-vars "NODE_ENV=production,PUBLIC_APP_URL=https://app.xcloud.co.tz,PGDATABASE=xcloud_production,PGUSER=postgres,PGHOST=/cloudsql/PROJECT_ID:europe-west2:xcloud-pg-db" \
  --set-secrets "JWT_SECRET=JWT_SECRET:latest,PGPASSWORD=PGPASSWORD:latest,RADIUS_SECRET=RADIUS_SECRET:latest,MPESA_API_KEY=MPESA_API_KEY:latest" \
  --add-cloudsql-instances PROJECT_ID:europe-west2:xcloud-pg-db
```

### Option B: Docker Container Deployment

```bash
# 1. Build and push image
docker build -t europe-west2-docker.pkg.dev/PROJECT_ID/xcloud/app:latest .
docker push europe-west2-docker.pkg.dev/PROJECT_ID/xcloud/app:latest

# 2. Deploy image to Cloud Run
gcloud run deploy xcloud-isp-controller \
  --image europe-west2-docker.pkg.dev/PROJECT_ID/xcloud/app:latest \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 8080 \
  --add-cloudsql-instances PROJECT_ID:europe-west2:xcloud-pg-db
```

---

## 6. Production Start Command

The build and runtime lifecycle is defined in `package.json`:

```bash
# Step 1: Compile frontend into /dist
npm run build

# Step 2: Start production server (listens on Cloud Run $PORT)
npm run start
# Executes: NODE_ENV=production tsx server.ts
```

---

## 7. Production Health-Check URL

Cloud Run liveness and readiness probe endpoint:
```
GET https://YOUR_SERVICE_URL.run.app/health
```
*(Also available at `/api/health`)*

### Sample 200 OK Response:
```json
{
  "status": "healthy",
  "uptimeSeconds": 3840,
  "timestamp": "2026-10-04T02:00:00.000Z",
  "service": "xcloud-isp-hotspot-controller",
  "version": "2.0.0-production",
  "cloudRun": {
    "port": 8080,
    "service": "xcloud-isp-controller",
    "revision": "xcloud-isp-controller-00004-qac"
  },
  "database": {
    "status": "healthy",
    "latencyMs": 2,
    "message": "Connected to xcloud_production"
  },
  "memory": {
    "rssMb": 48,
    "heapUsedMb": 31
  },
  "config": {
    "publicAppUrl": "https://app.xcloud.co.tz",
    "apiUrl": "/api",
    "webhookUrl": "/api/payments/webhook"
  }
}
```

---

## 8. Required DNS Configuration

To point your custom domain (e.g., `app.xcloud.co.tz`) to Google Cloud Run:

1. **Map Custom Domain**:
   ```bash
   gcloud beta run domain-mappings create \
     --service xcloud-isp-controller \
     --domain app.xcloud.co.tz \
     --region europe-west2
   ```

2. **Add DNS Records to Your Registrar (Cloudflare, Namecheap, GoDaddy)**:

   | Record Type | Host / Name | Value / Destination | TTL |
   |---|---|---|---|
   | **CNAME** | `app` | `ghs.googlehosted.com.` | Auto / 300s |
   | **TXT** *(Verification)* | `app` | `google-site-verification=...` | 300s |

3. Google Cloud Run automatically provisions, binds, and renews a free **Let's Encrypt SSL/TLS Certificate** via Managed Certificates.

---

## 9. Hardware & Integration Instructions

### MikroTik RouterOS Configuration
1. Open the XCLOUD Dashboard and navigate to **Routers** -> **Add Router**.
2. Click **1-Click Provision Script** to download the auto-generated RouterOS configuration.
3. Open Winbox or SSH to your MikroTik router and paste the script:
   - Configures `/interface wireguard` and attaches peer `10.88.0.1:51820`
   - Configures `/radius` client pointing to your XCLOUD server with `service=hotspot`
   - Configures `/ip hotspot profile` to delegate AAA to RADIUS
   - Schedules `/system scheduler` 60-second heartbeat telemetry to `/api/routers/:id/heartbeat`

### TP-Link Omada Controller Configuration
1. In XCLOUD, navigate to **TP-Link Omada** -> **Register Controller**.
2. Provide your Omada Software / Hardware Controller URL (`https://omada.domain.com:8043`), Site ID (`default`), and Operator credentials.
3. XCLOUD discovers all connected EAP Access Points, Omada Gateways (ER605/ER7206), and JetStream Switches.
4. Hotspot profiles automatically map to Omada External Captive Portal settings.

### Tanzania Mobile Money Webhooks
Configure your merchant notification endpoints in telco portals:
- **Vodacom M-Pesa OpenAPI**: `https://app.xcloud.co.tz/api/payments/webhook/vodacom_mpesa`
- **Tigo Pesa**: `https://app.xcloud.co.tz/api/payments/webhook/tigo_pesa`
- **Airtel Money**: `https://app.xcloud.co.tz/api/payments/webhook/airtel_money`
- **AzamPay Aggregator**: `https://app.xcloud.co.tz/api/payments/webhook/azampay`
