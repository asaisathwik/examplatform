/**
 * Script to securely set up the development demo account:
 * Email: andhe.saisathwik007@gmail.com
 * Password: Sathwik@007
 * 
 * Works with both Supabase Auth (when credentials exist) and local persistent store.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_exampilot_salt').digest('hex');
}

async function main() {
  const email = 'andhe.saisathwik007@gmail.com';
  const password = process.env.DEMO_USER_PASSWORD || 'Sathwik@007';
  const displayName = 'Sai Sathwik';

  console.log('--- ExamPilot Development Demo Account Setup ---');
  console.log(`Setting up demo account for: ${email}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-supabase')) {
    console.log('Connecting to Supabase Admin API...');
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName, role: 'student' }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log('User already exists in Supabase Auth.');
        } else {
          console.warn('Supabase Admin createUser warning:', error.message);
        }
      } else {
        console.log('Successfully created demo account in Supabase Auth:', data.user.id);
      }
    } catch (err) {
      console.warn('Could not connect to Supabase:', err.message);
    }
  } else {
    console.log('Supabase credentials not configured. Updating local persistent store...');
  }

  // Ensure local DB has the user
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.passwordHash = hashPassword(password);
      existing.displayName = displayName;
      console.log('Updated existing demo user in local persistent database.');
    } else {
      db.users.push({
        id: 'u-demo-sathwik-001',
        email,
        displayName,
        role: 'student',
        timezone: 'Asia/Kolkata',
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      });
      console.log('Added demo user to local persistent database.');
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  }

  console.log('Demo account setup completed successfully.');
}

main().catch(console.error);

