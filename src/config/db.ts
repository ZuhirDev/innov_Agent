import { Pool } from 'pg';
import CONFIG from '@/config/config';

/**
 * PostgreSQL connection pool instance.
 * Reuses the connection settings from the main application configuration.
 * Ensure that the database is reachable and SSL is configured correctly.
 */
export const poolConection = new Pool({
  host: CONFIG.PG.HOST,
  port: CONFIG.PG.PORT,
  database: CONFIG.PG.DATABASE,
  user: CONFIG.PG.USER,
  password: CONFIG.PG.PASSWORD,
  ssl: { rejectUnauthorized: false } // Recommended for external Supabase connections
});
