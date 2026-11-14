import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { startAttempt, getUserAttempts } from '@/lib/store';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId, scheduledTestId } = await request.json();
    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    const attemptData = startAttempt(testId, user.id, scheduledTestId);
    return NextResponse.json(attemptData, { status: 201 });
  } catch (error) {
    console.error('Start attempt error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start attempt' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examCategory = searchParams.get('examCategory');
    const testType = searchParams.get('testType');

    let attempts = getUserAttempts(user.id);

    if (examCategory && examCategory !== 'ALL') {
      attempts = attempts.filter(a => a.examCategory === examCategory);
    }
    if (testType && testType !== 'ALL') {
      attempts = attempts.filter(a => a.testType === testType);
    }

    return NextResponse.json({ total: attempts.length, attempts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attempted tests' }, { status: 500 });
  }
}

