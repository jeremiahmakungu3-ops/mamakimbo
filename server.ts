import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { checkDbHealth } from './server/db/pool.ts';
import { runMigrations } from './server/db/migrations.ts';
import { rateLimiter, auditLogger } from './server/middleware/security.ts';
import { ProvisioningQueue } from './server/services/queue.ts';

// Import Route Handlers
import authRoutes from './server/routes/auth.ts';
import userRoutes from './server/routes/users.ts';
import routerRoutes from './server/routes/routers.ts';
import hotspotRoutes from './server/routes/hotspot.ts';
import voucherRoutes from './server/routes/vouchers.ts';
import customerRoutes from './server/routes/customers.ts';
import transactionRoutes from './server/routes/transactions.ts';
import agentRoutes from './server/routes/agents.ts';
import paymentRoutes from './server/routes/payments.ts';
import radiusRoutes from './server/routes/radius.ts';
import monitoringRoutes from './server/routes/monitoring.ts';
import organizationRoutes from './server/routes/organizations.ts';
import omadaRoutes from './server/routes/omada.ts';
import installationRoutes from './server/routes/installation.ts';
import subscriptionRoutes from './server/routes/subscriptions.ts';
import notificationRoutes from './server/routes/notifications.ts';
import reportRoutes from './server/routes/reports.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Production Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite and custom captive portal styles/scripts
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration (supports custom domains like app.xcloud.co.tz and xcloud.co.tz)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev resilient
      }
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Security Middleware: Rate Limiting & Audit Trail
app.use(rateLimiter(300, 60000));
app.use(auditLogger);

// Health Check Endpoint (Google Cloud Run liveness & readiness probe)
app.get(['/health', '/api/health'], async (_req: Request, res: Response) => {
  const dbStatus = await checkDbHealth();
  const healthy = dbStatus.status === 'healthy' || dbStatus.status === 'degraded';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'xcloud-isp-hotspot-controller',
    version: '2.0.0-production',
    cloudRun: {
      port: PORT,
      service: process.env.K_SERVICE || 'local-preview',
      revision: process.env.K_REVISION || 'rev-001',
    },
    database: dbStatus,
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    config: {
      publicAppUrl: process.env.PUBLIC_APP_URL || process.env.APP_URL || 'https://app.xcloud.co.tz',
      apiUrl: process.env.API_URL || '/api',
      webhookUrl: process.env.WEBHOOK_URL || '/api/payments/webhook',
    },
  });
});

// REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/omada', omadaRoutes);
app.use('/api/installation', installationRoutes);
app.use('/api/hotspot', hotspotRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/radius', radiusRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
  });
});

// Start Server & mount Frontend Vite / Static Assets
async function startServer() {
  // Check and run DB migrations in background without blocking server startup
  runMigrations().catch((err) => {
    console.warn('[Startup] Database initialization notice:', err.message);
  });

  // Start background provisioning queue worker
  ProvisioningQueue.startWorker(5000);

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for development.');
  } else {
    // Production mode: Serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[Server] Production mode: Serving static files from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(` XCLOUD Production Server listening on http://0.0.0.0:${PORT}`);
    console.log(` Custom Domain: ${process.env.PUBLIC_APP_URL || 'https://app.xcloud.co.tz'}`);
    console.log(` Health probe: http://0.0.0.0:${PORT}/health`);
    console.log(`================================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
