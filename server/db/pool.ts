import pg from 'pg';
const { Pool } = pg;

export interface DbConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

let pool: pg.Pool | null = null;
let isConnected = false;
let lastDbError: string | null = null;

export function getDbConfig(): DbConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
    };
  }

  // Cloud SQL Auth Proxy Unix Socket or TCP host
  const host = process.env.SQL_HOST || process.env.PGHOST || '127.0.0.1';
  const port = parseInt(process.env.PGPORT || '5432', 10);
  const user = process.env.SQL_USER || process.env.PGUSER || 'postgres';
  const password = process.env.SQL_PASSWORD || process.env.PGPASSWORD || '';
  const database = process.env.SQL_DB_NAME || process.env.PGDATABASE || 'netpulse_db';

  return {
    host,
    port,
    user,
    password,
    database,
    max: 10,
    connectionTimeoutMillis: 5000,
  };
}

export function initDbPool(): pg.Pool {
  if (pool) return pool;

  const config = getDbConfig();
  console.log(`[Database] Initializing PostgreSQL connection pool (Host: ${config.host || 'connectionString'}, Database: ${config.database || 'default'})...`);

  pool = new Pool(config);

  pool.on('connect', () => {
    isConnected = true;
    lastDbError = null;
  });

  pool.on('error', (err) => {
    isConnected = false;
    lastDbError = err.message;
    console.error('[Database] Idle client error on PostgreSQL pool:', err.message);
  });

  return pool;
}

export async function checkDbHealth(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; message?: string; latencyMs?: number }> {
  const currentPool = initDbPool();
  const startTime = Date.now();
  try {
    const res = await currentPool.query('SELECT 1 AS alive, current_database() AS db, version() AS ver');
    isConnected = true;
    lastDbError = null;
    return {
      status: 'healthy',
      latencyMs: Date.now() - startTime,
      message: `Connected to ${res.rows[0]?.db || 'PostgreSQL'}`,
    };
  } catch (error: any) {
    isConnected = false;
    lastDbError = error.message;
    return {
      status: 'degraded',
      latencyMs: Date.now() - startTime,
      message: error.message || 'Database unreachable. Using transactional memory fallback.',
    };
  }
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const currentPool = initDbPool();
  try {
    return await currentPool.query<T>(text, params);
  } catch (error: any) {
    console.error(`[Database Query Error]: ${error.message} - Query: "${text.substring(0, 100)}..."`);
    throw error;
  }
}

export function getPool(): pg.Pool {
  return initDbPool();
}
