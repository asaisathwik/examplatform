import { NextResponse } from 'next/server';
import { getPapers, getExams } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const year = searchParams.get('year');

    const papers = getPapers({ examId, year });
    const exams = getExams();

    const papersWithExam = papers.map(p => ({
      ...p,
      exam: exams.find(e => e.id === p.examId)
    }));

    return NextResponse.json({ papers: papersWithExam });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}

