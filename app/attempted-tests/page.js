'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  History,
  Award,
  Target,
  Clock,
  Filter,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  BookOpen
} from 'lucide-react';

export default function AttemptedTestsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    async function loadAttempts() {
      try {
        const res = await fetch('/api/attempts');
        if (res.ok) {
          const data = await res.json();
          setAttempts(data.attempts || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadAttempts();
  }, []);

  const filteredAttempts = attempts.filter(a => {
    if (selectedType !== 'ALL' && a.testType !== selectedType) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attempted Tests History</h1>
            <p className="text-sm text-slate-500 mt-1">
              Review your completed exam attempts, solutions, and historical score milestones.
            </p>
          </div>

          <Link
            href="/create-test"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Take New Test</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filter Type:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="ALL">All Test Formats</option>
              <option value="PYQ">Previous Year Papers</option>
              <option value="CUSTOM">Custom Practice Tests</option>
              <option value="AI_GENERATED">AI Generated Tests</option>
            </select>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-50/50">
                    <th className="py-3.5 px-6 font-semibold">Test Title</th>
                    <th className="py-3.5 px-6 font-semibold">Exam</th>
                    <th className="py-3.5 px-6 font-semibold">Type</th>
                    <th className="py-3.5 px-6 font-semibold">Score</th>
                    <th className="py-3.5 px-6 font-semibold">Accuracy</th>
                    <th className="py-3.5 px-6 font-semibold">Date Attempted</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-slate-900">{att.testTitle}</td>
                      <td className="py-4 px-6 text-slate-600">{att.examName}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {att.testType}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-indigo-600">
                        {att.marksObtained} / {att.maxMarks}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-700">
                        {att.accuracyPercentage ? `${att.accuracyPercentage}%` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(att.submittedAt || att.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/tests/${att.testId}/results/${att.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
                        >
                          <span>View Results</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Attempt Records Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take an exam mock test or practice previous year questions to see your performance history here.
              </p>
              <Link
                href="/create-test"
                className="mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Start Practice
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

