import { NextResponse } from 'next/server';
import { getQuestions, addQuestions } from '@/lib/store';
import { getSessionUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const sourceType = searchParams.get('sourceType');
    const verificationStatus = searchParams.get('verificationStatus');
    const year = searchParams.get('year');

    const questions = getQuestions({
      examId,
      subjectId,
      topicId,
      difficulty,
      sourceType,
      verificationStatus,
      year
    });

    return NextResponse.json({
      total: questions.length,
      questions
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const questionsToSave = Array.isArray(body.questions) ? body.questions : [body];

    const saved = addQuestions(questionsToSave.map(q => ({ ...q, createdBy: user.id })));
    return NextResponse.json({ success: true, count: saved.length, questions: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add questions' }, { status: 500 });
  }
}

