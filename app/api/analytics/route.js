import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserAnalytics } from '@/lib/store';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = getUserAnalytics(user.id);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

