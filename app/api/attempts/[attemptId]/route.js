import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAttemptState } from '@/lib/store';

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = params;
    const attemptData = getAttemptState(attemptId, user.id);

    if (!attemptData) {
      return NextResponse.json({ error: 'Attempt not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(attemptData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve attempt' }, { status: 500 });
  }
}

