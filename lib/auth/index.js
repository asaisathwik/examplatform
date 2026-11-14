import { cookies } from 'next/headers';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { findUserByEmail, findUserById, createUser, verifyPassword, DEMO_USER } from '@/lib/store';

const SESSION_COOKIE_NAME = 'exampilot_session';

export async function getSessionUser() {
  // 1. Try Supabase Auth first if configured
  try {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        return {
          id: user.id,
          email: user.email,
          displayName: user.user_metadata?.full_name || user.email.split('@')[0],
          role: 'student'
        };
      }
    }
  } catch (e) {
    // Supabase not reachable or unconfigured, fall through
  }

  // 2. Check local session cookie
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const parsed = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
      if (parsed.userId) {
        const user = findUserById(parsed.userId);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            timezone: user.timezone
          };
        }
      }
    }
  } catch (e) {
    // Invalid cookie
  }

  return null;
}

export function createSessionCookie(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    createdAt: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export const AUTH_COOKIE_NAME = SESSION_COOKIE_NAME;

