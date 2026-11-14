'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Database,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck
} from 'lucide-react';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedSourceType, setSelectedSourceType] = useState('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [qRes, eRes, sRes, tRes] = await Promise.all([
          fetch('/api/questions'),
          fetch('/api/exams'),
          fetch('/api/exams/exam-ssc-cgl/subjects'),
          fetch('/api/topics')
        ]);

        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions || []);
        }
        if (eRes.ok) {
          const eData = await eRes.json();
          setExams(eData.exams || []);
        }
        if (sRes.ok) {
          const sData = await sRes.json();
          setSubjects(sData.subjects || []);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          setTopics(tData.topics || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredQuestions = questions.filter(q => {
    if (selectedExam !== 'ALL' && q.examId !== selectedExam) return false;
    if (selectedSubject !== 'ALL' && q.subjectId !== selectedSubject) return false;
    if (selectedDifficulty !== 'ALL' && q.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (selectedSourceType !== 'ALL' && q.sourceType !== selectedSourceType) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const textMatch = q.questionText.toLowerCase().includes(term);
      const explanationMatch = (q.explanation || '').toLowerCase().includes(term);
      return textMatch || explanationMatch;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank & Knowledge Base</h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore and filter verified previous-year questions and AI-assisted practice items.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Total Questions: <span className="text-indigo-600 font-bold">{questions.length}</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by keywords, formulas, or question text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Examination</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="ALL">All Exams</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Source Type</label>
              <select
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="ALL">All Sources</option>
                <option value="PYQ">Verified PYQ</option>
                <option value="AI_GENERATED">AI Generated</option>
                <option value="USER_UPLOADED">User Uploaded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {filteredQuestions.map((q, index) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id || index}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition"
              >
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 flex items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {q.sourceType}
                      </span>
                      {q.year && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Year {q.year}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        +{q.marks || 2} / -{q.negativeMarks || 0.5} marks
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                      Q{index + 1}. {q.questionText}
                    </div>
                  </div>

                  <button type="button" className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border ${
                            opt.id === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-950 ring-1 ring-emerald-400/20'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{opt.id}.</span>
                          <span>{opt.text}</span>
                          {opt.id === q.correctAnswer && (
                            <span className="ml-2 text-emerald-700 font-bold text-[11px]">(Correct Answer)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Detailed Solution:</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{q.explanation}</div>
                      </div>
                    )}

                    {/* Provenance footnote */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <div>Source: {q.sourceName || 'ExamPilot Verified Archive'}</div>
                      <div>Status: <span className="font-semibold text-emerald-600">{q.verificationStatus}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

