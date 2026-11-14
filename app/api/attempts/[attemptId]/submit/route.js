import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { submitAttempt } from '@/lib/store';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = params;
    let liveAnswers = [];
    let isAutoExpired = false;

    try {
      const body = await request.json();
      liveAnswers = body.liveAnswers || [];
      isAutoExpired = !!body.isAutoExpired;
    } catch (e) {
      // Empty body is okay for submission
    }

    const result = submitAttempt(attemptId, user.id, liveAnswers, isAutoExpired);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit test' }, { status: 500 });
  }
}

