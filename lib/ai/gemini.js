import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export function isGeminiConfigured() {
  return Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('your-gemini-api-key'));
}

export function getGeminiModel(modelName = 'gemini-1.5-flash') {
  if (!isGeminiConfigured()) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate competitive exam questions using Gemini
 */
export async function generateExamQuestions({
  examName = 'SSC CGL',
  subject = 'Reasoning Ability',
  topics = ['Series', 'Analogy'],
  difficulty = 'Medium',
  count = 5,
  instructions = ''
}) {
  if (!isGeminiConfigured()) {
    // Return sample draft questions so the user can test the preview, edit, and approval workflow
    return {
      configured: false,
      message: 'GEMINI_API_KEY is not configured in .env.local. Providing demonstration AI draft questions for preview.',
      questions: generateSampleAiQuestions(examName, subject, topics, difficulty, count)
    };
  }

  const model = getGeminiModel('gemini-1.5-flash');
  const topicListStr = Array.isArray(topics) ? topics.join(', ') : topics;

  const prompt = `You are a senior exam question setter for Indian competitive examinations such as SSC, Banking, and RRB.
Generate exactly ${count} multiple choice questions (MCQs) for the examination "${examName}" on the subject "${subject}" covering the topic(s): ${topicListStr}.
Difficulty level: ${difficulty}.
${instructions ? `Additional user guidance: ${instructions}` : ''}

CRITICAL RULES:
1. Each question must strictly have 4 distinct options labelled A, B, C, and D.
2. The correctAnswer must be one of "A", "B", "C", or "D".
3. Provide an accurate, pedagogical, step-by-step explanation.
4. For numerical, logical, or arithmetic questions, double check all mathematical steps and option calculations.
5. Return ONLY a valid JSON array of question objects, with NO surrounding markdown backticks or commentary.

JSON Schema format:
[
  {
    "questionText": "Question string...",
    "options": [
      { "id": "A", "text": "Option A text" },
      { "id": "B", "text": "Option B text" },
      { "id": "C", "text": "Option C text" },
      { "id": "D", "text": "Option D text" }
    ],
    "correctAnswer": "A",
    "explanation": "Detailed step-by-step solution...",
    "subject": "${subject}",
    "topic": "${topicListStr}",
    "difficulty": "${difficulty}",
    "marks": 2,
    "negativeMarks": 0.5,
    "sourceType": "AI_GENERATED",
    "verificationStatus": "AI_DRAFT"
  }
]`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2, // Low temperature for high factual accuracy
        maxOutputTokens: 4096,
      }
    });

    const responseText = result.response.text().trim();
    // Strip code fences if present
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Validate structured output
    const validated = validateAndNormalizeQuestions(parsed, subject, topicListStr, difficulty);
    return {
      configured: true,
      questions: validated
    };
  } catch (error) {
    console.error('Gemini question generation error:', error);
    return {
      configured: true,
      error: error.message || 'Failed to generate questions with Gemini',
      questions: generateSampleAiQuestions(examName, subject, topics, difficulty, count)
    };
  }
}

/**
 * Process document content (text extracted from PDF or scanned notes)
 */
export async function processDocumentWithGemini({
  documentText,
  mode = 'EXTRACT_QUESTIONS', // 'EXTRACT_QUESTIONS' | 'GENERATE_FROM_NOTES'
  examName = 'SSC CGL',
  subject = 'General Practice',
  count = 5,
  difficulty = 'Medium'
}) {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      message: 'GEMINI_API_KEY is not configured in .env.local. Providing demonstration extracted questions for preview.',
      questions: generateSampleAiQuestions(examName, subject, ['Document Extraction'], difficulty, count)
    };
  }

  const model = getGeminiModel('gemini-1.5-flash');

  let prompt = '';
  if (mode === 'EXTRACT_QUESTIONS') {
    prompt = `You are an AI document parser specialized in extracting examination papers.
Analyze the following document text and extract all multiple choice questions (MCQs), options, answer keys, and explanations if present.
If an answer key is missing from the document, deduce the correct answer and mark verificationStatus as "AI_DRAFT".
Document text:
"""
${documentText.slice(0, 15000)}
"""

Format your response strictly as a JSON array of objects:
[
  {
    "questionText": "Extracted question string...",
    "options": [
      { "id": "A", "text": "Option text" },
      { "id": "B", "text": "Option text" },
      { "id": "C", "text": "Option text" },
      { "id": "D", "text": "Option text" }
    ],
    "correctAnswer": "A",
    "explanation": "Solution or extracted rationale",
    "subject": "${subject}",
    "topic": "Extracted Document",
    "difficulty": "${difficulty}",
    "marks": 2,
    "negativeMarks": 0.5,
    "sourceType": "USER_UPLOADED",
    "verificationStatus": "UNVERIFIED"
  }
]
Return ONLY pure JSON.`;
  } else {
    prompt = `You are a teacher designing an exam paper based strictly on the provided study notes.
Generate ${count} MCQs based directly on the key concepts, facts, formulas, and principles in these notes:
"""
${documentText.slice(0, 15000)}
"""

Target Exam: ${examName}
Subject: ${subject}
Difficulty: ${difficulty}

Format strictly as a JSON array of question objects (options A, B, C, D, correctAnswer, explanation, etc.). Return ONLY pure JSON.`;
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
    });

    const responseText = result.response.text().trim();
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = validateAndNormalizeQuestions(parsed, subject, 'Document Topic', difficulty);

    return {
      configured: true,
      questions: validated
    };
  } catch (error) {
    console.error('Gemini document processing error:', error);
    return {
      configured: true,
      error: error.message,
      questions: generateSampleAiQuestions(examName, subject, ['Document Notes'], difficulty, count)
    };
  }
}

/**
 * Deterministic validation on question structures
 */
export function validateAndNormalizeQuestions(items, defaultSubject, defaultTopic, defaultDifficulty) {
  if (!Array.isArray(items)) {
    throw new Error('AI output is not an array of questions');
  }

  return items.map((item, index) => {
    if (!item.questionText || typeof item.questionText !== 'string') {
      throw new Error(`Question ${index + 1} has invalid or missing questionText`);
    }

    let options = item.options;
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error(`Question ${index + 1} does not have sufficient options`);
    }

    // Normalize options format
    options = options.map((opt, i) => {
      const letter = ['A', 'B', 'C', 'D'][i] || `Opt${i+1}`;
      if (typeof opt === 'string') {
        return { id: letter, text: opt };
      }
      return {
        id: opt.id ? String(opt.id).toUpperCase() : letter,
        text: String(opt.text || opt.value || '')
      };
    });

    const validIds = options.map(o => o.id);
    let correct = item.correctAnswer ? String(item.correctAnswer).trim().toUpperCase() : validIds[0];
    if (!validIds.includes(correct)) {
      correct = validIds[0];
    }

    return {
      id: `ai-q-${Date.now()}-${index}`,
      questionText: item.questionText.trim(),
      options,
      correctAnswer: correct,
      explanation: item.explanation || 'Step-by-step solution generated by AI.',
      subject: item.subject || defaultSubject,
      topic: item.topic || defaultTopic,
      difficulty: item.difficulty || defaultDifficulty,
      marks: item.marks ? Number(item.marks) : 2,
      negativeMarks: item.negativeMarks ? Number(item.negativeMarks) : 0.5,
      sourceType: item.sourceType || 'AI_GENERATED',
      verificationStatus: item.verificationStatus || 'AI_DRAFT'
    };
  });
}

function generateSampleAiQuestions(examName, subject, topics, difficulty, count = 5) {
  const topicName = Array.isArray(topics) ? topics[0] || 'General' : topics;
  const samples = [
    {
      id: `ai-sample-1`,
      questionText: `In the context of ${examName} (${subject}), which of the following statements regarding ${topicName} is correct?`,
      options: [
        { id: 'A', text: 'It operates directly proportional to standard rate parameters.' },
        { id: 'B', text: 'It remains entirely independent of variable adjustments.' },
        { id: 'C', text: 'It is inversely related to reciprocal variance indices.' },
        { id: 'D', text: 'It applies strictly under non-linear conditions only.' }
      ],
      correctAnswer: 'A',
      explanation: 'Under fundamental principles of this topic, the direct relationship is preserved when base variables remain normalized.',
      subject: subject,
      topic: topicName,
      difficulty: difficulty,
      marks: 2,
      negativeMarks: 0.5,
      sourceType: 'AI_GENERATED',
      verificationStatus: 'AI_DRAFT'
    },
    {
      id: `ai-sample-2`,
      questionText: `If a sequence follows a pattern based on ${topicName}, what will be the next term after 14, 28, 56, 112?`,
      options: [
        { id: 'A', text: '224' },
        { id: 'B', text: '196' },
        { id: 'C', text: '210' },
        { id: 'D', text: '240' }
      ],
      correctAnswer: 'A',
      explanation: 'Each term is multiplied by 2 (geometric series with common ratio 2). 112 * 2 = 224.',
      subject: subject,
      topic: topicName,
      difficulty: difficulty,
      marks: 2,
      negativeMarks: 0.5,
      sourceType: 'AI_GENERATED',
      verificationStatus: 'AI_DRAFT'
    },
    {
      id: `ai-sample-3`,
      questionText: `In a coding convention tested in ${examName}, if SMART is coded as TNBSU, how is DRAFT coded?`,
      options: [
        { id: 'A', text: 'ESBGU' },
        { id: 'B', text: 'ESBFU' },
        { id: 'C', text: 'ETCGU' },
        { id: 'D', text: 'FSBGU' }
      ],
      correctAnswer: 'A',
      explanation: 'Each letter is shifted forward by +1: D(+1)=E, R(+1)=S, A(+1)=B, F(+1)=G, T(+1)=U -> ESBGU.',
      subject: subject,
      topic: topicName,
      difficulty: difficulty,
      marks: 2,
      negativeMarks: 0.5,
      sourceType: 'AI_GENERATED',
      verificationStatus: 'AI_DRAFT'
    }
  ];

  return samples.slice(0, count);
}

