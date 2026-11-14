'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
  Loader2,
  BookOpen,
  User,
  Info
} from 'lucide-react';

export default function ExamAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const { testId, attemptId } = params;

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Authoritative server timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [deadlineAt, setDeadlineAt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Track initial instructions accepted
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

  // Load attempt state from server
  useEffect(() => {
    async function fetchAttempt() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load test attempt');
        }

        // If attempt is already completed or expired, jump straight to result page
        if (data.attempt?.status === 'COMPLETED' || data.attempt?.status === 'EXPIRED') {
          router.replace(`/tests/${testId}/results/${attemptId}`);
          return;
        }

        setTest(data.test);
        setQuestions(data.questions || []);
        setDeadlineAt(data.attempt.deadlineAt);

        // Map answer slots by orderIndex
        const ansMap = {};
        (data.answers || []).forEach(ans => {
          ansMap[ans.orderIndex] = {
            selectedOption: ans.selectedOption || null,
            status: ans.status || 'NOT_VISITED'
          };
        });
        setAnswers(ansMap);

        // Server authoritative remaining seconds
        const serverRemaining = Math.max(0, Math.floor((new Date(data.attempt.deadlineAt) - new Date()) / 1000));
        setRemainingSeconds(serverRemaining);
        setInstructionsAccepted(true);
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      fetchAttempt();
    }
  }, [attemptId, testId, router]);

  // Server-authoritative countdown loop
  useEffect(() => {
    if (!deadlineAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((new Date(deadlineAt) - now) / 1000));
      setRemainingSeconds(diff);

      // Auto-submit when time expires
      if (diff <= 0) {
        clearInterval(interval);
        handleFinalSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  const currentQ = questions[currentIndex] || null;
  const currentOrder = currentIndex + 1;
  const currentAnswer = answers[currentOrder] || { selectedOption: null, status: 'NOT_VISITED' };

  // Save answer to server in background
  const saveAnswerToServer = async (orderIndex, selectedOption, status) => {
    try {
      await fetch(`/api/attempts/${attemptId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIndex,
          selectedOption,
          status
        })
      });
    } catch (e) {
      console.error('Failed to sync answer with server', e);
    }
  };

  const handleSelectOption = (optionId) => {
    const newStatus = currentAnswer.status === 'MARKED_FOR_REVIEW' || currentAnswer.status === 'ANSWERED_AND_MARKED'
      ? 'ANSWERED_AND_MARKED'
      : 'ANSWERED';

    const updated = {
      ...answers,
      [currentOrder]: {
        selectedOption: optionId,
        status: newStatus
      }
    };
    setAnswers(updated);
    saveAnswerToServer(currentOrder, optionId, newStatus);
  };

  const handleClearResponse = () => {
    const updated = {
      ...answers,
      [currentOrder]: {
        selectedOption: null,
        status: 'NOT_ANSWERED'
      }
    };
    setAnswers(updated);
    saveAnswerToServer(currentOrder, null, 'NOT_ANSWERED');
  };

  const handleMarkForReview = () => {
    const hasSelection = Boolean(currentAnswer.selectedOption);
    const newStatus = hasSelection ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';

    const updated = {
      ...answers,
      [currentOrder]: {
        ...currentAnswer,
        status: newStatus
      }
    };
    setAnswers(updated);
    saveAnswerToServer(currentOrder, currentAnswer.selectedOption, newStatus);

    // Advance to next question if available
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  const handleNavigate = (newIdx) => {
    // If current was NOT_VISITED and has no selection, mark as NOT_ANSWERED
    if (currentAnswer.status === 'NOT_VISITED' && !currentAnswer.selectedOption) {
      const updated = {
        ...answers,
        [currentOrder]: {
          ...currentAnswer,
          status: 'NOT_ANSWERED'
        }
      };
      setAnswers(updated);
      saveAnswerToServer(currentOrder, null, 'NOT_ANSWERED');
    }

    setCurrentIndex(newIdx);

    // Mark the next question as visited if it was NOT_VISITED
    const nextOrder = newIdx + 1;
    const nextAns = answers[nextOrder];
    if (!nextAns || nextAns.status === 'NOT_VISITED') {
      const updated = {
        ...answers,
        [nextOrder]: {
          selectedOption: nextAns?.selectedOption || null,
          status: 'NOT_ANSWERED'
        }
      };
      setAnswers(updated);
      saveAnswerToServer(nextOrder, null, 'NOT_ANSWERED');
    }
  };

  const handleFinalSubmit = async (isAutoExpired = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build latest answers payload
      const liveAnswers = Object.entries(answers).map(([ord, data]) => ({
        orderIndex: parseInt(ord),
        selectedOption: data.selectedOption,
        status: data.status
      }));

      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveAnswers,
          isAutoExpired
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      router.replace(`/tests/${testId}/results/${attemptId}`);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Format seconds into HH:MM:SS
  const formatTime = (secs) => {
    if (secs === null || isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Question status counters
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;
  let markedCount = 0;
  let markedAndAnsweredCount = 0;

  questions.forEach((_, idx) => {
    const ord = idx + 1;
    const status = answers[ord]?.status || 'NOT_VISITED';
    if (status === 'ANSWERED') answeredCount++;
    else if (status === 'NOT_ANSWERED') notAnsweredCount++;
    else if (status === 'MARKED_FOR_REVIEW') markedCount++;
    else if (status === 'ANSWERED_AND_MARKED') markedAndAnsweredCount++;
    else notVisitedCount++;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center space-y-4 max-w-sm w-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <div className="text-sm font-bold text-slate-800">Authorizing CBT Exam Session...</div>
          <div className="text-xs text-slate-500">Synchronizing authoritative server timer and question bank.</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center space-y-4 max-w-md w-full">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <div className="text-base font-bold text-slate-900">Session Error</div>
          <p className="text-xs text-slate-600">{errorMessage}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* CBT Top Examination Header */}
      <header className="bg-slate-900 text-white h-14 px-4 sm:px-6 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs sm:text-sm font-bold truncate">{test?.title || 'Examination Test'}</h1>
            <div className="text-[10px] text-slate-400">Section: Objective Multiple Choice Assessment</div>
          </div>
        </div>

        {/* Server Authoritative Timer Banner */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider shadow-inner ${
            remainingSeconds !== null && remainingSeconds < 300
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-slate-800 text-emerald-400 border border-slate-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span>Time Left: {formatTime(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Pane (70-75% width on desktop) */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto border-r border-slate-200">
          {/* Question Info Ribbon */}
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
            <div className="font-bold text-slate-900 text-sm">
              Question {currentOrder} of {questions.length}
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-emerald-700">+{test?.marksPerQ || 2} Marks</span>
              {test?.negativeMarking && (
                <span className="text-red-600">-{test?.negativeMarksPerQ || 0.5} Negative</span>
              )}
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="flex-1 p-6 space-y-6">
            <div className="text-sm sm:text-base font-medium text-slate-900 whitespace-pre-line leading-relaxed">
              {currentQ?.questionText}
            </div>

            {/* MCQ Radio Options */}
            <div className="space-y-3 pt-2">
              {currentQ?.options?.map((opt) => {
                const isSelected = currentAnswer.selectedOption === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 font-medium text-indigo-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentOrder}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                    />
                    <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                      <span className="font-bold mr-2 text-slate-600">{opt.id}.</span>
                      <span>{opt.text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkForReview}
                className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Mark for Review & Next</span>
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                disabled={!currentAnswer.selectedOption}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => handleNavigate(currentIndex - 1)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    handleNavigate(currentIndex + 1);
                  } else {
                    setShowSubmitModal(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
              >
                <span>{currentIndex === questions.length - 1 ? 'Save & Review' : 'Save & Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: TCS / SSC Style Question Palette (25-30% width) */}
        <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto">
          {/* Legend Grid */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2 text-[11px]">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Question Status Legend</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {answeredCount}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {notAnsweredCount}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {markedCount}
                </span>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-700 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-emerald-400">
                  {markedAndAnsweredCount}
                </span>
                <span>Ans & Marked</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                  {notVisitedCount}
                </span>
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* Palette Numbers Grid */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm space-y-2 flex-1">
            <div className="font-bold text-slate-700 text-xs">Question Palette</div>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pt-1">
              {questions.map((_, idx) => {
                const ord = idx + 1;
                const status = answers[ord]?.status || 'NOT_VISITED';
                const isCurrent = idx === currentIndex;

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
                if (status === 'ANSWERED') {
                  colorClasses = 'bg-emerald-600 text-white border-emerald-700';
                } else if (status === 'NOT_ANSWERED') {
                  colorClasses = 'bg-rose-600 text-white border-rose-700';
                } else if (status === 'MARKED_FOR_REVIEW') {
                  colorClasses = 'bg-purple-600 text-white border-purple-700';
                } else if (status === 'ANSWERED_AND_MARKED') {
                  colorClasses = 'bg-purple-700 text-white border-purple-800 ring-2 ring-emerald-400';
                }

                return (
                  <button
                    key={ord}
                    type="button"
                    onClick={() => handleNavigate(idx)}
                    className={`h-9 w-full rounded-lg text-xs font-bold border transition flex items-center justify-center cursor-pointer ${colorClasses} ${
                      isCurrent ? 'ring-2 ring-indigo-500 scale-105 shadow-sm' : ''
                    }`}
                  >
                    {ord}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish & Submit Test</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Test Submission</h3>
                <p className="text-xs text-slate-500">Please review your question attempt summary</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-emerald-700">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount + markedAndAnsweredCount}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-rose-600">Unanswered / Not Visited:</span>
                <span className="font-bold text-rose-600">{notAnsweredCount + notVisitedCount}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-purple-700">Marked for Review:</span>
                <span className="font-bold text-purple-700">{markedCount + markedAndAnsweredCount}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Once submitted, your responses will be scored authoritatively and you cannot modify answers.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scoring Answers...</span>
                  </>
                ) : (
                  <span>Yes, Submit Test</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

