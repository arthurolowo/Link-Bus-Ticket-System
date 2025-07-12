import { db } from '../storage.js';
import { sql } from 'drizzle-orm';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check database connection
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function getSystemHealth() {
  const dbStatus = await checkDatabaseConnection();
  
  return {
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
} 