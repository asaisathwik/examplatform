import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateAttemptAnswer } from '@/lib/store';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = params;
    const body = await request.json();

    const answer = updateAttemptAnswer(attemptId, user.id, body);
    return NextResponse.json({ success: true, answer });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update answer' }, { status: 400 });
  }
}

