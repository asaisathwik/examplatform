import { NextResponse } from 'next/server';
import { getTopics } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    const topics = getTopics(subjectId);
    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

