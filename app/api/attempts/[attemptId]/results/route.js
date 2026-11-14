import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAttemptResult } from '@/lib/store';

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = params;
    const result = getAttemptResult(attemptId, user.id);

    if (!result) {
      return NextResponse.json({ error: 'Result not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve results' }, { status: 500 });
  }
}

