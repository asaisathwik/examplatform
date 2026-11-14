import { NextResponse } from 'next/server';
import { getSubjects, getExamById } from '@/lib/store';

export async function GET(request, { params }) {
  try {
    const { examId } = params;
    const exam = getExamById(examId);
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const subjects = getSubjects(examId);
    return NextResponse.json({ exam, subjects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exam subjects' }, { status: 500 });
  }
}

