import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/store';
import { createSessionCookie, AUTH_COOKIE_NAME } from '@/lib/auth';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Try Supabase Auth if configured
    try {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            role: 'student'
          };
          const response = NextResponse.json({ user: userObj });
          const token = createSessionCookie(userObj);
          response.cookies.set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
            path: '/',
          });
          return response;
        }
      }
    } catch (e) {
      // Supabase unavailable, continue to local authentication
    }

    // 2. Local Database / Demo account authentication
    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userObj = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      timezone: user.timezone
    };

    const token = createSessionCookie(userObj);
    const response = NextResponse.json({ user: userObj });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}

