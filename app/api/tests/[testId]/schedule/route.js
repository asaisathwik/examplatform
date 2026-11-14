import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { scheduleTest, getTestById } from '@/lib/store';

export async function POST(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = params;
    const test = getTestById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const { scheduledFor, durationMinutes } = await request.json();

    if (!scheduledFor) {
      return NextResponse.json({ error: 'Scheduled date and time is required' }, { status: 400 });
    }

    const scheduleDate = new Date(scheduledFor);
    if (isNaN(scheduleDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled date format' }, { status: 400 });
    }

    const scheduled = scheduleTest(
      testId,
      user.id,
      scheduleDate.toISOString(),
      durationMinutes || test.durationMinutes
    );

    return NextResponse.json({ success: true, schedule: scheduled }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to schedule exam' }, { status: 500 });
  }
}

