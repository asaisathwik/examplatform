import { NextResponse } from 'next/server';
import { getCategories, getExams } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const categories = getCategories();
    const exams = getExams(categoryId);

    return NextResponse.json({ categories, exams });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams data' }, { status: 500 });
  }
}

