import dotenv from 'dotenv';
dotenv.config();

import { execSync } from 'child_process';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

console.log('Attempting to push schema with DATABASE_URL:', databaseUrl);

try {
  execSync(`drizzle-kit push --config drizzle.config.json`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });
  console.log('Database schema pushed successfully!');
} catch (error) {
  console.error('Failed to push database schema:', error);
  process.exit(1);
} 