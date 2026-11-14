import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/store';
import { createSessionCookie, AUTH_COOKIE_NAME } from '@/lib/auth';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Try Supabase Auth if configured
    try {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName } }
        });
        if (!error && data?.user) {
          const userObj = {
            id: data.user.id,
            email: data.user.email,
            displayName: displayName || email.split('@')[0],
            role: 'student'
          };
          const response = NextResponse.json({ user: userObj });
          const token = createSessionCookie(userObj);
          response.cookies.set(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
          });
          return response;
        }
      }
    } catch (e) {
      // Supabase unconfigured, proceed locally
    }

    // Local registration
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const newUser = createUser({ email, password, displayName });
    const userObj = {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      timezone: newUser.timezone
    };

    const token = createSessionCookie(userObj);
    const response = NextResponse.json({ user: userObj }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

