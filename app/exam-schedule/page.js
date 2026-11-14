'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Play,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Loader2
} from 'lucide-react';

function ExamScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedTestId = searchParams.get('testId');

  const [scheduledTests, setScheduledTests] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(preSelectedTestId || '');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editDateTime, setEditDateTime] = useState('');

  useEffect(() => {
    // Set default date/time to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localIso = tomorrow.toISOString().slice(0, 16);
    setScheduledDateTime(localIso);

    loadScheduleData();
  }, []);

  async function loadScheduleData() {
    try {
      const [schRes, papersRes] = await Promise.all([
        fetch('/api/scheduled-tests'),
        fetch('/api/papers')
      ]);

      if (schRes.ok) {
        const data = await schRes.json();
        setScheduledTests(data.scheduledTests || []);
      }

      // Load available tests from papers for quick scheduling
      if (papersRes.ok) {
        const pData = await papersRes.json();
        const available = pData.papers.map(p => ({
          id: `test-${p.id}`,
          title: p.title,
          duration: p.durationMinutes
        }));
        setTests(available);
        if (!selectedTestId && available.length > 0) {
          setSelectedTestId(available[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedTestId) {
      setErrorMessage('Please select a test to schedule');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/tests/${selectedTestId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor: new Date(scheduledDateTime).toISOString(),
          durationMinutes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule exam');

      setSuccessMessage('Exam successfully scheduled!');
      await loadScheduleData();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to cancel this scheduled test?')) return;

    try {
      const res = await fetch(`/api/scheduled-tests/${scheduleId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadScheduleData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSchedule = async (scheduleId) => {
    try {
      const res = await fetch(`/api/scheduled-tests/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: editDateTime })
      });
      if (res.ok) {
        setEditingId(null);
        await loadScheduleData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exam Schedule Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Plan your preparation timetable, set target test slots, and build steady examination stamina.
          </p>
        </div>

        {/* Schedule Creation Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Schedule a Test Session</h2>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateSchedule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Test
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                {tests.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Duration (Mins)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  <span>Save Schedule</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Scheduled Tests List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Scheduled Timetable</h2>
            <span className="text-xs text-slate-500 font-medium">{scheduledTests.length} tests planned</span>
          </div>

          {scheduledTests.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {scheduledTests.map((st) => (
                <div key={st.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{st.testTitle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        st.status === 'AVAILABLE' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(st.scheduledFor).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{st.durationMinutes} mins</span>
                      </div>
                      <div>Exam: {st.examName}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === st.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="datetime-local"
                          value={editDateTime}
                          onChange={(e) => setEditDateTime(e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateSchedule(st.id)}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {st.status === 'AVAILABLE' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const attemptRes = await fetch('/api/attempts', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ testId: st.testId, scheduledTestId: st.id })
                              });
                              const data = await attemptRes.json();
                              if (data.attempt?.id) {
                                router.push(`/tests/${st.testId}/attempt/${data.attempt.id}`);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Start Test</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(st.id);
                              setEditDateTime(new Date(st.scheduledFor).toISOString().slice(0, 16));
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            title="Edit date/time"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCancelSchedule(st.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          title="Cancel schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No scheduled sessions yet. Use the form above to add a future practice test.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ExamSchedulePage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-xs text-slate-500">
        Loading exam schedule...
      </div>
    }>
      <ExamScheduleContent />
    </Suspense>
  );
}
