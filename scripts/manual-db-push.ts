import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  try {
    // First, run the SQL migration
    await pool.query(`
      -- Add isVerified and isAdmin columns to users table
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

      -- Update existing users
      UPDATE users SET is_verified = FALSE WHERE is_verified IS NULL;
      UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;
    `);
    
    console.log('✅ Database schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    process.exit(1);
  }
}

main(); 