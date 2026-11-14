'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  ShieldCheck,
  Play,
  ArrowRight,
  Filter,
  ExternalLink
} from 'lucide-react';

export default function PreviousYearPapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [papersRes, examsRes] = await Promise.all([
          fetch('/api/papers'),
          fetch('/api/exams')
        ]);

        if (papersRes.ok) {
          const pData = await papersRes.json();
          setPapers(pData.papers || []);
        }

        if (examsRes.ok) {
          const eData = await examsRes.json();
          setExams(eData.exams || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredPapers = papers.filter(p => {
    if (selectedExamId !== 'ALL' && p.examId !== selectedExamId) return false;
    if (selectedYear !== 'ALL' && String(p.year) !== selectedYear) return false;
    return true;
  });

  const handleStartPyq = async (paper) => {
    try {
      // Create a test instance from this paper
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'PYQ',
          paperId: paper.id,
          title: paper.title,
          durationMinutes: paper.durationMinutes
        })
      });

      const data = await res.json();
      if (res.ok && data.test?.id) {
        // Start attempt
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Previous Year Question Papers (PYQs)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Attempt official competitive examination papers with genuine provenance and official answer keys.
          </p>
        </div>

        {/* Filter controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="ALL">All Examinations</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="ALL">All Years</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>

        {/* Papers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPapers.map(paper => (
            <div
              key={paper.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {paper.exam?.name || 'Verified Exam'}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {paper.year} • {paper.shift || 'Shift 1'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {paper.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{paper.totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{paper.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{paper.totalMarks} Marks</span>
                  </div>
                </div>

                {/* Provenance note */}
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Provenance:</span> {paper.sourceProvenance}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified PYQ</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleStartPyq(paper)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Test</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

