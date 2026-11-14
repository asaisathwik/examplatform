'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function PerformanceAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Analytics & Diagnostic Insights</h1>
          <p className="text-sm text-slate-500 mt-1">
            Data-driven evaluation of your subject readiness, accuracy consistency, and syllabus strengths.
          </p>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Mock Tests</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{analytics?.totalTests ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Completed assessments</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mean Score</span>
            <div className="mt-2 text-3xl font-extrabold text-indigo-600">{analytics?.avgScore ?? 0}%</div>
            <div className="mt-1 text-xs text-slate-400">Peak Score: {analytics?.highestScore ?? 0}%</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">{analytics?.overallAccuracy ?? 0}%</div>
            <div className="mt-1 text-xs text-slate-400">Correct vs total attempted</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Practice Time</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-800">{analytics?.totalPracticeMinutes ?? 0} <span className="text-sm font-normal text-slate-500">mins</span></div>
            <div className="mt-1 text-xs text-slate-400">Time spent answering</div>
          </div>
        </div>

        {/* Chronological Score Trajectory */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Score & Accuracy Trajectory (Recent Tests)</h2>
            <p className="text-xs text-slate-500">Chronological trend of your test percentage over time</p>
          </div>

          {analytics?.scoreTrends && analytics.scoreTrends.length > 0 ? (
            <div className="pt-6">
              <div className="h-48 flex items-end gap-3 border-b border-slate-100 pb-2">
                {analytics.scoreTrends.map((st, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {st.score}%
                    </div>
                    <div
                      style={{ height: `${Math.max(15, st.score)}%` }}
                      className="w-full max-w-[48px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg group-hover:brightness-110 transition-all"
                    ></div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[64px] text-center mt-1">
                      {st.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">Take more tests to plot progression trajectory.</div>
          )}
        </div>

        {/* Subject-Wise Mastery */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Subject-Wise Performance Distribution</h2>
          <div className="space-y-4">
            {analytics?.subjectBreakdown && analytics.subjectBreakdown.length > 0 ? (
              analytics.subjectBreakdown.map((subj, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{subj.name}</span>
                    <span className="font-semibold text-slate-500">
                      {subj.avgAccuracy}% Accuracy • {subj.avgScore}% Avg Score ({subj.testsAttempted} tests)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, subj.avgAccuracy)}%` }}
                      className="h-full bg-indigo-600 rounded-full"
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-xs text-slate-400 text-center">Subject mastery data will populate after attempting tests.</div>
            )}
          </div>
        </div>

        {/* Strengths & Weaknesses Analysis with Actionable Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Strongest Topics (&ge; 70% Accuracy)</h3>
                <p className="text-[11px] text-slate-500">Maintain mastery with periodic revision</p>
              </div>
            </div>

            <div className="space-y-2">
              {analytics?.strongTopics && analytics.strongTopics.length > 0 ? (
                analytics.strongTopics.map((top, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-950">{top.topicName}</span>
                    <span className="font-bold text-emerald-700">{top.accuracy}% Accuracy</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No high-accuracy topics recorded yet.</div>
              )}
            </div>
          </div>

          {/* Actionable Weak Areas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Targeted Improvement Syllabus</h3>
                <p className="text-[11px] text-slate-500">Topics causing score drops or negative marking</p>
              </div>
            </div>

            <div className="space-y-2">
              {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
                analytics.weakTopics.map((top, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-amber-950">{top.topicName}</div>
                      <div className="text-[10px] text-amber-700">Accuracy: {top.accuracy}%</div>
                    </div>
                    <Link
                      href={`/create-test?topic=${encodeURIComponent(top.topicName)}`}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Practise Now
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No weak topics found. Take more diverse tests to diagnose.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

