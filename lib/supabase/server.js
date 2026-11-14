import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient(cookieStore = null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase')) {
    return null;
  }

  const resolvedCookies = cookieStore || cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return resolvedCookies.get(name)?.value;
      },
      set(name, value, options) {
        try {
          resolvedCookies.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
        }
      },
      remove(name, options) {
        try {
          resolvedCookies.set({ name, value: '', ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}

