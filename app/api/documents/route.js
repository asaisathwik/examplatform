import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUploadedDocuments } from '@/lib/store';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docs = getUploadedDocuments(user.id);
    return NextResponse.json({ documents: docs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch uploaded documents' }, { status: 500 });
  }
}

