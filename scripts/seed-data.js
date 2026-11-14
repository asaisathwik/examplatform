/**
 * Seed data runner for local development and offline persistence
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'db.json');

console.log('--- ExamPilot Database Seeder ---');

if (fs.existsSync(dbFile)) {
  console.log(`Database already initialized at ${dbFile}`);
} else {
  console.log('Database will be automatically initialized and seeded on first app launch.');
}

console.log('Supabase SQL migration file available at: supabase/migrations/01_initial_schema.sql');
console.log('Supabase Seed SQL file available at: supabase/seed.sql');

