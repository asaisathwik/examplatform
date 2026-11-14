import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { saveUploadedDocument } from '@/lib/store';
import { processDocumentWithGemini } from '@/lib/ai/gemini';
import pdfParse from 'pdf-parse';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mode = formData.get('mode') || 'EXTRACT_QUESTIONS'; // 'EXTRACT_QUESTIONS' | 'GENERATE_FROM_NOTES'
    const examName = formData.get('examName') || 'SSC CGL';
    const subject = formData.get('subject') || 'General Practice';
    const count = parseInt(formData.get('count')) || 5;
    const difficulty = formData.get('difficulty') || 'Medium';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Limit file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum 10 MB limit' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || '';
      } catch (err) {
        console.warn('PDF parse fallback:', err);
        extractedText = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
      }
    } else if (fileType.includes('text') || fileName.toLowerCase().endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      // For images or unsupported direct text, create a placeholder representation for AI OCR processing
      extractedText = `Document: ${fileName}. Contains scanned examination material for ${examName} - ${subject}.`;
    }

    if (!extractedText.trim()) {
      extractedText = `Extracted notes from ${fileName} on ${subject} for ${examName}.`;
    }

    // Process through Gemini or fallback
    const aiResult = await processDocumentWithGemini({
      documentText: extractedText,
      mode,
      examName,
      subject,
      count,
      difficulty
    });

    const docRecord = saveUploadedDocument(user.id, {
      fileName,
      fileType,
      fileSize: file.size,
      processingMode: mode,
      status: 'EXTRACTED',
      extractedData: {
        textSnippet: extractedText.slice(0, 500),
        questionCount: aiResult.questions ? aiResult.questions.length : 0
      }
    });

    return NextResponse.json({
      success: true,
      document: docRecord,
      configured: aiResult.configured,
      message: aiResult.message,
      questions: aiResult.questions || []
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
  }
}
