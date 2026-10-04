import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, checkDbHealth } from './pool.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[Migrations] Checking database connectivity and schema status...');
  const health = await checkDbHealth();

  if (health.status !== 'healthy') {
    console.warn(`[Migrations] PostgreSQL not reachable at startup (${health.message}). Initializing resilient fallback store.`);
    return false;
  }

  try {
    const migrationPath = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
    let sql = '';
    if (fs.existsSync(migrationPath)) {
      sql = fs.readFileSync(migrationPath, 'utf8');
    } else {
      console.warn('[Migrations] Migration file not found on disk, skipping file execution.');
      return false;
    }

    console.log('[Migrations] Applying schema 001_initial_schema.sql...');
    await query(sql);
    console.log('[Migrations] 001_initial_schema.sql applied successfully.');
    return true;
  } catch (error: any) {
    console.error('[Migrations] Migration execution failed:', error.message);
    return false;
  }
}
