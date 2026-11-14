import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    // ignore
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

