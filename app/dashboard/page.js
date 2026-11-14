'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import {
  Award,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  BookOpen,
  FileUp,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Play
} from 'lucide-react';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsRes, upcomingRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/scheduled-tests')
        ]);

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data.analytics);
        }

        if (upcomingRes.ok) {
          const data = await upcomingRes.json();
          setUpcomingTests(data.scheduledTests || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome & Quick Actions Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Exam Preparation Command Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your mock test scores, target weak syllabus topics, and prepare for SSC, Banking, and RRB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/create-test"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm shadow-indigo-600/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Custom Test</span>
            </Link>
            <Link
              href="/previous-year-papers"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Previous Year Papers</span>
            </Link>
            <Link
              href="/upload-documents"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs border border-purple-200/60 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Document-to-Test</span>
            </Link>
          </div>
        </div>

        {/* 5 Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tests Attempted</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {analytics?.totalTests ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500">All-time completed tests</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Score</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {analytics?.avgScore ? `${analytics.avgScore}%` : 'N/A'}
            </div>
            <div className="mt-1 text-xs text-slate-500">Highest: {analytics?.highestScore ? `${analytics.highestScore}%` : '0%'}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-700">
              {analytics?.overallAccuracy ? `${analytics.overallAccuracy}%` : 'N/A'}
            </div>
            <div className="mt-1 text-xs text-slate-500">Correct / Attempted ratio</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Practice Time</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {analytics?.totalPracticeMinutes ?? 0} <span className="text-sm font-normal text-slate-500">mins</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">Active test duration</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming Tests</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-purple-700">
              {upcomingTests.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">Scheduled for practice</div>
          </div>
        </div>

        {/* Middle Grid: Score Trend & Upcoming Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Overview (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Performance & Score Trends</h2>
                <p className="text-xs text-slate-500">Recent test score trajectory and subject performance</p>
              </div>
              <Link href="/analytics" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>Detailed Analytics</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual Bar representation of recent score history */}
            {analytics?.scoreTrends && analytics.scoreTrends.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 flex items-end gap-3 pt-6 border-b border-slate-100">
                  {analytics.scoreTrends.map((t, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[11px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.score}%
                      </div>
                      <div
                        style={{ height: `${Math.max(12, t.score)}%` }}
                        className="w-full max-w-[42px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all group-hover:brightness-110"
                      ></div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[60px] text-center mt-1">
                        {t.date}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subject-wise breakdown bars */}
                <div className="pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Tests Attempted by Subject
                  </h3>
                  <div className="space-y-2.5">
                    {analytics?.subjectBreakdown && analytics.subjectBreakdown.length > 0 ? (
                      analytics.subjectBreakdown.map((subj, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{subj.name}</span>
                            <span className="text-slate-500 font-semibold">{subj.avgAccuracy}% Accuracy ({subj.testsAttempted} tests)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, subj.avgAccuracy)}%` }}
                              className="h-full bg-indigo-500 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 py-2">Attempt tests across multiple subjects to see distribution.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">No score history yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Take your first mock examination or attempt a previous year question paper to populate score metrics.
                </p>
                <Link
                  href="/create-test"
                  className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium"
                >
                  Start Your First Test
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Tests Section (1 col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upcoming Tests</h2>
                  <p className="text-xs text-slate-500">Scheduled practice sessions</p>
                </div>
                <Link href="/upcoming-tests" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View All
                </Link>
              </div>

              {upcomingTests.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTests.slice(0, 3).map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{st.testTitle}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          st.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(st.scheduledFor).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.testDuration}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-medium text-slate-700">No scheduled tests</div>
                  <p className="text-[11px] text-slate-500">
                    Plan your test schedule ahead of time to build consistent practice habits.
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/exam-schedule"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition cursor-pointer mt-2"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Schedule New Practice</span>
            </Link>
          </div>
        </div>

        {/* Weak and Strong Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Strong Performance Areas</h2>
            </div>
            <p className="text-xs text-slate-500">Topics with consistently high accuracy across tests</p>

            <div className="space-y-2 pt-2">
              {analytics?.strongTopics && analytics.strongTopics.length > 0 ? (
                analytics.strongTopics.map((top, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                    <span className="font-semibold text-emerald-950">{top.topicName}</span>
                    <span className="font-bold text-emerald-700">{top.accuracy}% Accuracy</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3">Strong topics will appear after taking tests.</div>
              )}
            </div>
          </div>

          {/* Weak Areas & Recommendations */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Focus & Improvement Areas</h2>
            </div>
            <p className="text-xs text-slate-500">Recommended topics for targeted practice</p>

            <div className="space-y-2 pt-2">
              {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
                analytics.weakTopics.map((top, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-lg border border-amber-100 text-xs">
                    <span className="font-semibold text-amber-950">{top.topicName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700">{top.accuracy}%</span>
                      <Link
                        href={`/create-test?topic=${encodeURIComponent(top.topicName)}`}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded text-[10px] font-medium"
                      >
                        Practise
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3">No weak areas identified. Attempt more questions to uncover areas for revision.</div>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Recent Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Attempt History</h2>
              <p className="text-xs text-slate-500">Review your past test attempts and detailed solutions</p>
            </div>
            <Link href="/attempted-tests" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View All Attempts
            </Link>
          </div>

          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Test Name</th>
                    <th className="pb-3 font-semibold">Exam</th>
                    <th className="pb-3 font-semibold">Score</th>
                    <th className="pb-3 font-semibold">Accuracy</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {analytics.recentActivity.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-semibold text-slate-900">{attempt.testTitle}</td>
                      <td className="py-3 text-slate-600">{attempt.examName}</td>
                      <td className="py-3 font-bold text-indigo-600">{attempt.marksObtained} / {attempt.maxMarks}</td>
                      <td className="py-3 font-medium text-emerald-600">{attempt.accuracyPercentage ? `${attempt.accuracyPercentage}%` : 'N/A'}</td>
                      <td className="py-3 text-slate-500">{new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/tests/${attempt.testId}/results/${attempt.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
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
            <div className="py-8 text-center text-xs text-slate-500">
              No attempted tests yet. Click "Create Custom Test" to start practicing.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

