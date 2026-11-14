import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateUserProfile } from '@/lib/store';

export async function PUT(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = updateUserProfile(user.id, body);

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        timezone: updated.timezone,
        role: updated.role
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

