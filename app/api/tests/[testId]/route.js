import { NextResponse } from 'next/server';
import { getTestById, getExamById, getSubjects } from '@/lib/store';

export async function GET(request, { params }) {
  try {
    const { testId } = params;
    const test = getTestById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const exam = test.examId ? getExamById(test.examId) : null;

    return NextResponse.json({
      test: {
        ...test,
        examName: exam ? exam.name : 'Competitive Exam',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

