'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  UploadCloud,
  FileCheck,
  Play
} from 'lucide-react';

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingMode, setProcessingMode] = useState('EXTRACT_QUESTIONS');
  const [examName, setExamName] = useState('SSC CGL');
  const [subject, setSubject] = useState('General Practice');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  const [isUploading, setIsUploading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadUserDocuments();
  }, []);

  async function loadUserDocuments() {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setUploadedDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleUploadAndProcess = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF or image file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setStatusMessage('Uploading and parsing document...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', processingMode);
    formData.append('examName', examName);
    formData.append('subject', subject);
    formData.append('count', questionCount);
    formData.append('difficulty', difficulty);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process document');

      setExtractedQuestions(data.questions || []);
      setStatusMessage(`Successfully processed! Extracted ${data.questions?.length || 0} questions for review.`);
      await loadUserDocuments();
    } catch (err) {
      setErrorMessage(err.message);
      setStatusMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const removeQuestion = (idx) => {
    setExtractedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateTestFromExtracted = async () => {
    if (extractedQuestions.length === 0) return;

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'AI',
          title: `Document Practice - ${selectedFile?.name || 'Uploaded Notes'}`,
          customQuestions: extractedQuestions,
          durationMinutes: Math.max(10, extractedQuestions.length * 2)
        })
      });

      const data = await res.json();
      if (res.ok && data.test?.id) {
        const attRes = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId: data.test.id })
        });
        const attData = await attRes.json();
        if (attRes.ok && attData.attempt?.id) {
          router.push(`/tests/${data.test.id}/attempt/${attData.attempt.id}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Document-to-Test Generator</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload PDFs, scanned question papers, or study notes. Extract questions or generate new questions using Gemini AI.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProcessingMode('EXTRACT_QUESTIONS')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                processingMode === 'EXTRACT_QUESTIONS'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Mode 1</div>
              <div className="text-sm font-bold text-slate-900 mt-1">Extract Existing Questions</div>
              <p className="text-xs text-slate-500 mt-0.5">Parse an uploaded question paper or previous test PDF</p>
            </button>

            <button
              type="button"
              onClick={() => setProcessingMode('GENERATE_FROM_NOTES')}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                processingMode === 'GENERATE_FROM_NOTES'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-purple-600">Mode 2</div>
              <div className="text-sm font-bold text-slate-900 mt-1">Generate Questions from Notes</div>
              <p className="text-xs text-slate-500 mt-0.5">Synthesize exam-pattern questions grounded in your uploaded study notes</p>
            </button>
          </div>

          <form onSubmit={handleUploadAndProcess} className="space-y-4">
            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition cursor-pointer bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click to upload PDF, scanned paper, or image'}
                </div>
                <div className="text-xs text-slate-400">
                  Supported formats: PDF, PNG, JPG, TXT (Maximum 10 MB)
                </div>
              </label>
            </div>

            {/* Target Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Examination</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Questions to Generate</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value={3}>3 Questions (Fast)</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with Gemini AI Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract & Generate Questions</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Extracted Questions Preview & Approval */}
        {extractedQuestions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Review & Approve Questions ({extractedQuestions.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect the extracted questions and answer keys before finalizing into an exam test.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateTestFromExtracted}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Approve & Start Test</span>
              </button>
            </div>

            <div className="space-y-4">
              {extractedQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-bold text-slate-900">
                      Q{idx + 1}. {q.questionText}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border ${
                          opt.id === q.correctAnswer
                            ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold mr-1">{opt.id}.</span> {opt.text}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previously Uploaded Documents */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Document Upload History</h2>
          {uploadedDocs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-semibold text-slate-900">{doc.fileName}</div>
                      <div className="text-slate-400 text-[11px]">
                        Mode: {doc.processingMode} • {new Date(doc.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center">
              No documents uploaded yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

