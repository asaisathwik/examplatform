'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  Award,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  Check,
  X,
  Filter,
  Loader2
} from 'lucide-react';

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const { testId, attemptId } = params;

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionFilter, setQuestionFilter] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/results`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch result');

        setResultData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <div className="text-sm font-bold text-slate-800">Calculating Official Score & Analytics...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !resultData) {
    return (
      <AppLayout>
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="text-red-600 font-bold">Error loading examination results</div>
          <p className="text-xs text-slate-500">{error || 'Result record could not be retrieved.'}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold inline-block">
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { attempt, test, exam, topicPerformance = [], questionReviews = [] } = resultData;

  const filteredReviews = questionReviews.filter(qr => {
    if (questionFilter === 'CORRECT') return qr.isCorrect === true;
    if (questionFilter === 'INCORRECT') return qr.isCorrect === false;
    if (questionFilter === 'UNANSWERED') return qr.isCorrect === null;
    return true;
  });

  const timeMinutes = Math.floor((attempt.timeTakenSeconds || 0) / 60);
  const timeSeconds = (attempt.timeTakenSeconds || 0) % 60;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {test?.testType || 'Official Test'}
              </span>
              <span className="text-xs text-slate-400">• Completed on {new Date(attempt.submittedAt || attempt.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{test?.title || 'Examination Test'}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Target: {exam?.name || 'Competitive Exam'} • Scoring Scheme: +{test?.marksPerQ || 2} / -{test?.negativeMarking ? (test?.negativeMarksPerQ || 0.5) : 0} Marks
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/create-test"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Similar Test</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Score Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marks Obtained</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-indigo-600">{attempt.marksObtained}</span>
              <span className="text-sm font-semibold text-slate-400">/ {attempt.maxMarks}</span>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {attempt.scorePercentage}% Percentage
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accuracy</span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">
              {attempt.accuracyPercentage ? `${attempt.accuracyPercentage}%` : 'N/A'}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {attempt.correctAnswers} of {attempt.correctAnswers + attempt.incorrectAnswers} attempted correct
            </div>
          </div>

          {/* Answer Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Breakdown</span>
            <div className="mt-2 flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700">{attempt.correctAnswers} Correct</span>
              <span className="text-rose-600">{attempt.incorrectAnswers} Wrong</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {attempt.unanswered} Unattempted
            </div>
          </div>

          {/* Time Taken */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Taken</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-800">
              {timeMinutes}m {timeSeconds}s
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Allocated: {test?.durationMinutes} mins
            </div>
          </div>
        </div>

        {/* Topic-Wise Performance */}
        {topicPerformance.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Topic-Wise Performance Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Topic</th>
                    <th className="pb-3 font-semibold">Total Qs</th>
                    <th className="pb-3 font-semibold text-emerald-700">Correct</th>
                    <th className="pb-3 font-semibold text-rose-600">Incorrect</th>
                    <th className="pb-3 font-semibold text-slate-500">Skipped</th>
                    <th className="pb-3 font-semibold text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topicPerformance.map((topic, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900">{topic.topicName}</td>
                      <td className="py-3 font-semibold">{topic.totalQuestions}</td>
                      <td className="py-3 font-bold text-emerald-700">+{topic.correct}</td>
                      <td className="py-3 font-bold text-rose-600">-{topic.incorrect}</td>
                      <td className="py-3 text-slate-400">{topic.unanswered}</td>
                      <td className="py-3 text-right font-bold text-indigo-600">{topic.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Question-Wise Solution Review */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Question-by-Question Solution Review</h2>
              <p className="text-xs text-slate-500">Detailed step-by-step explanations and verified official answers</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setQuestionFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  questionFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({questionReviews.length})
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilter('CORRECT')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  questionFilter === 'CORRECT' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Correct ({attempt.correctAnswers})
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilter('INCORRECT')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  questionFilter === 'INCORRECT' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Incorrect ({attempt.incorrectAnswers})
              </button>
              <button
                type="button"
                onClick={() => setQuestionFilter('UNANSWERED')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  questionFilter === 'UNANSWERED' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Skipped ({attempt.unanswered})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const q = review.question;
              const isCorrect = review.isCorrect === true;
              const isWrong = review.isCorrect === false;
              const isSkipped = review.selectedOption === null;

              return (
                <div
                  key={review.orderIndex}
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isWrong
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-slate-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800">
                        Q{review.orderIndex}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWrong
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isCorrect ? 'Correct (+2)' : isWrong ? 'Incorrect (-0.5)' : 'Not Attempted'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Difficulty: {q.difficulty} • Topic: {q.topic || 'Reasoning'}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt) => {
                      const isCandidateSelected = review.selectedOption === opt.id;
                      const isAnswerKey = q.correctAnswer === opt.id;

                      let optClasses = 'border-slate-200 bg-white text-slate-700';
                      if (isAnswerKey) {
                        optClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-400';
                      } else if (isCandidateSelected && !isAnswerKey) {
                        optClasses = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border flex items-center justify-between ${optClasses}`}>
                          <div>
                            <span className="font-bold mr-2">{opt.id}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isAnswerKey && (
                            <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">
                              Correct Answer
                            </span>
                          )}
                          {isCandidateSelected && !isAnswerKey && (
                            <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Step-by-Step Pedagogical Explanation */}
                  {q.explanation && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Step-by-Step Pedagogical Explanation:</span>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed text-slate-600">
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

