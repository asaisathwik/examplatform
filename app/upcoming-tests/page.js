'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  Clock,
  Calendar,
  Play,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Timer
} from 'lucide-react';

export default function UpcomingTestsPage() {
  const router = useRouter();
  const [scheduledTests, setScheduledTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update live clock every second for countdowns
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadUpcoming() {
      try {
        const res = await fetch('/api/scheduled-tests');
        if (res.ok) {
          const data = await res.json();
          setScheduledTests(data.scheduledTests || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUpcoming();
  }, []);

  const handleStartScheduledTest = async (testId, scheduleId) => {
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, scheduledTestId: scheduleId })
      });
      const data = await res.json();
      if (res.ok && data.attempt?.id) {
        router.push(`/tests/${testId}/attempt/${data.attempt.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  function formatCountdown(targetDate) {
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return 'Ready to start';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Starts in ${days}d ${hours % 24}h`;
    }
    return `Starts in ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upcoming Tests</h1>
            <p className="text-sm text-slate-500 mt-1">
              Active test schedule, live countdowns, and quick access to available mocks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/exam-schedule')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule More</span>
          </button>
        </div>

        {scheduledTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledTests.map((st) => {
              const isReady = new Date(st.scheduledFor) <= now || st.status === 'AVAILABLE';
              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-2xl p-6 border transition space-y-4 shadow-sm flex flex-col justify-between ${
                    isReady ? 'border-emerald-300 ring-1 ring-emerald-400/30' : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {st.examName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isReady
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isReady ? 'AVAILABLE NOW' : st.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {st.testTitle}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(st.scheduledFor).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{st.testDuration} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Timer className={`w-4 h-4 ${isReady ? 'text-emerald-600' : 'text-amber-500'}`} />
                      <span>{formatCountdown(st.scheduledFor)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartScheduledTest(st.testId, st.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        isReady
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isReady ? 'Start Test' : 'Start Early'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Upcoming Tests</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You don't have any exams scheduled right now. Schedule a mock test to keep your preparation on track.
            </p>
            <button
              type="button"
              onClick={() => router.push('/exam-schedule')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule Practice Test</span>
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

