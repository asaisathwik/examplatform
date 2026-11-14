import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createTest, getQuestions, getPapers, getExamById } from '@/lib/store';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to create a test' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mode, // 'PYQ' | 'CUSTOM' | 'AI'
      examId,
      subjectId,
      topicIds = [],
      questionCount = 10,
      durationMinutes = 30,
      difficulty = 'Mixed',
      questionSource = 'Verified Question Bank',
      title,
      negativeMarking = true,
      negativeMarksPerQ = 0.5,
      marksPerQ = 2,
      paperId,
      customQuestions
    } = body;

    const requestedCount = parseInt(questionCount);
    const duration = parseInt(durationMinutes);

    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Test duration must be greater than zero minutes' }, { status: 400 });
    }

    if (isNaN(requestedCount) || requestedCount <= 0) {
      return NextResponse.json({ error: 'Question count must be a positive number' }, { status: 400 });
    }

    let selectedQuestions = [];
    let finalTitle = title;
    let testType = mode || 'CUSTOM';

    // 1. PYQ Mode
    if (mode === 'PYQ' && paperId) {
      const papers = getPapers();
      const paper = papers.find(p => p.id === paperId);
      if (!paper) {
        return NextResponse.json({ error: 'Previous Year Paper not found' }, { status: 404 });
      }

      const allQ = getQuestions();
      selectedQuestions = allQ.filter(q => paper.questionIds.includes(q.id));
      finalTitle = title || paper.title;
      testType = 'PYQ';
    }
    // 2. AI Mode with pre-approved custom questions
    else if (mode === 'AI' && Array.isArray(customQuestions) && customQuestions.length > 0) {
      selectedQuestions = customQuestions;
      finalTitle = title || `AI Generated Test - ${customQuestions.length} Questions`;
      testType = 'AI_GENERATED';
    }
    // 3. Custom Practice Test Mode
    else {
      testType = 'CUSTOM';
      let eligible = getQuestions({
        examId,
        subjectId,
        difficulty: difficulty !== 'Mixed' ? difficulty : null
      });

      // Filter by selected topics if any
      if (topicIds && topicIds.length > 0) {
        eligible = eligible.filter(q => topicIds.includes(q.topicId));
      }

      // Check sufficient questions - NEVER silently generate fewer!
      if (eligible.length < requestedCount) {
        const exam = examId ? getExamById(examId) : null;
        return NextResponse.json({
          error: `Insufficient questions in the verified question bank for the selected criteria. Requested: ${requestedCount}, Available: ${eligible.length}.`,
          availableCount: eligible.length,
          requestedCount,
          suggestion: eligible.length > 0 
            ? `You can reduce question count to ${eligible.length}, choose 'Mixed' difficulty, or use AI question generation.`
            : `Please select additional topics, choose another subject, or generate practice questions with Gemini AI.`
        }, { status: 400 });
      }

      // Shuffle or pick requested count
      const shuffled = [...eligible].sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, requestedCount);

      if (!finalTitle) {
        const exam = examId ? getExamById(examId) : null;
        finalTitle = `${exam ? exam.name : 'Practice'} Test (${selectedQuestions.length} Qs)`;
      }
    }

    const newTest = createTest({
      title: finalTitle,
      examId: examId || null,
      testType,
      subjectId: subjectId || null,
      durationMinutes: duration,
      negativeMarking,
      negativeMarksPerQ,
      marksPerQ,
      createdBy: user.id
    }, selectedQuestions);

    return NextResponse.json({ test: newTest }, { status: 201 });
  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create test' }, { status: 500 });
  }
}

