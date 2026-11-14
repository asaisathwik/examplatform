import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateScheduledTest, deleteScheduledTest } from '@/lib/store';

export async function PATCH(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleId } = params;
    const body = await request.json();

    const updated = updateScheduledTest(scheduleId, user.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Scheduled test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, schedule: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update scheduled test' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleId } = params;
    const deleted = deleteScheduledTest(scheduleId, user.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Scheduled test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Scheduled test cancelled' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel scheduled test' }, { status: 500 });
  }
}

