import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateExamQuestions } from '@/lib/ai/gemini';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      examName,
      subject,
      topics,
      difficulty = 'Medium',
      count = 5,
      instructions = ''
    } = body;

    const result = await generateExamQuestions({
      examName,
      subject,
      topics,
      difficulty,
      count: Math.min(25, Math.max(1, parseInt(count) || 5)),
      instructions
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI generation API error:', error);
    return NextResponse.json({ error: error.message || 'AI generation failed' }, { status: 500 });
  }
}

