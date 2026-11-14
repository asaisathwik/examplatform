import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getScheduledTests } from '@/lib/store';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduled = getScheduledTests(user.id);
    return NextResponse.json({ scheduledTests: scheduled });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scheduled tests' }, { status: 500 });
  }
}

