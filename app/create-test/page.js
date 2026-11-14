'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  BookOpen,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  HelpCircle,
  ArrowRight,
  Loader2,
  Trash2,
  Edit2,
  Calendar,
  Check,
  ChevronDown
} from 'lucide-react';

export default function CreateTestPage() {
  const router = useRouter();

  // Mode Selection: 'PYQ' | 'CUSTOM' | 'AI'
  const [activeMode, setActiveMode] = useState('CUSTOM');

  // Master Data
  const [categories, setCategories] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [papers, setPapers] = useState([]);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [questionCount, setQuestionCount] = useState(25);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [marksPerQ, setMarksPerQ] = useState(2);
  const [negativeMarksPerQ, setNegativeMarksPerQ] = useState(0.5);
  const [customTitle, setCustomTitle] = useState('');

  // Mode A: PYQ Selected Paper
  const [selectedPaperId, setSelectedPaperId] = useState('');

  // Mode C: AI Generation State
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [aiMessage, setAiMessage] = useState('');

  // Status & Validation
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Load Categories, Exams, Papers
  useEffect(() => {
    async function loadData() {
      try {
        const [examsRes, papersRes] = await Promise.all([
          fetch('/api/exams'),
          fetch('/api/papers')
        ]);

        if (examsRes.ok) {
          const data = await examsRes.json();
          setCategories(data.categories || []);
          setAllExams(data.exams || []);

          if (data.categories?.length > 0) {
            setSelectedCategory(data.categories[0].id);
          }
        }

        if (papersRes.ok) {
          const data = await papersRes.json();
          setPapers(data.papers || []);
          if (data.papers?.length > 0) {
            setSelectedPaperId(data.papers[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load exams data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter exams by category
  const filteredExams = allExams.filter(e => !selectedCategory || e.categoryId === selectedCategory);

  // Auto-select first exam when category changes
  useEffect(() => {
    if (filteredExams.length > 0) {
      setSelectedExam(filteredExams[0].id);
    } else {
      setSelectedExam('');
    }
  }, [selectedCategory, allExams]);

  // Load subjects for selected exam
  useEffect(() => {
    if (!selectedExam) return;

    async function loadSubjects() {
      try {
        const res = await fetch(`/api/exams/${selectedExam}/subjects`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
          if (data.subjects?.length > 0) {
            setSelectedSubject(data.subjects[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadSubjects();
  }, [selectedExam]);

  // Load topics for selected subject
  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      setSelectedTopics([]);
      return;
    }

    async function loadTopics() {
      try {
        const res = await fetch(`/api/topics?subjectId=${selectedSubject}`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics || []);
          setSelectedTopics([]); // reset selection
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadTopics();
  }, [selectedSubject]);

  const toggleTopic = (topicId) => {
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  // Trigger AI generation
  const handleGenerateWithAi = async () => {
    setAiGenerating(true);
    setErrorMessage('');
    setAiMessage('');

    const currentExam = allExams.find(e => e.id === selectedExam);
    const currentSubject = subjects.find(s => s.id === selectedSubject);
    const currentTopicNames = topics
      .filter(t => selectedTopics.includes(t.id))
      .map(t => t.name);

    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: currentExam ? currentExam.name : 'SSC CGL',
          subject: currentSubject ? currentSubject.name : 'Reasoning',
          topics: currentTopicNames.length > 0 ? currentTopicNames : ['Core Syllabus Topics'],
          difficulty,
          count: questionCount,
          instructions: aiInstructions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');

      setAiQuestions(data.questions || []);
      setAiConfigured(data.configured !== false);
      if (data.message) setAiMessage(data.message);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const removeAiQuestion = (index) => {
    setAiQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Submit and create test
  const handleCreateTest = async (startImmediately = true) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setWarningMessage('');

    try {
      let payload = {
        mode: activeMode,
        examId: selectedExam,
        subjectId: selectedSubject,
        durationMinutes,
        negativeMarking,
        marksPerQ,
        negativeMarksPerQ,
        title: customTitle
      };

      if (activeMode === 'PYQ') {
        payload.paperId = selectedPaperId;
      } else if (activeMode === 'AI') {
        if (aiQuestions.length === 0) {
          throw new Error('Please generate and review AI questions before creating the test.');
        }
        payload.customQuestions = aiQuestions;
        payload.questionCount = aiQuestions.length;
      } else {
        payload.questionCount = questionCount;
        payload.difficulty = difficulty;
        payload.topicIds = selectedTopics;
      }

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.suggestion) {
          setWarningMessage(`${data.error} Suggestion: ${data.suggestion}`);
        }
        throw new Error(data.error || 'Failed to create test');
      }

      const createdTestId = data.test.id;

      if (startImmediately) {
        // Start test attempt right away
        const attemptRes = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId: createdTestId })
        });
        const attemptData = await attemptRes.json();
        if (attemptRes.ok && attemptData.attempt?.id) {
          router.push(`/tests/${createdTestId}/attempt/${attemptData.attempt.id}`);
        } else {
          router.push(`/dashboard`);
        }
      } else {
        // Redirect to scheduling page
        router.push(`/exam-schedule?testId=${createdTestId}`);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Examination Test</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose between verified Previous Year Papers, adaptive custom topic practice, or Gemini AI question generation.
          </p>
        </div>

        {/* 3 Modes Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => { setActiveMode('CUSTOM'); setErrorMessage(''); }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeMode === 'CUSTOM'
                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </span>
              {activeMode === 'CUSTOM' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-900">Custom Practice Test</div>
              <div className="text-xs text-slate-500 mt-0.5">Filter by syllabus topics, difficulty, and duration</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('PYQ'); setErrorMessage(''); }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeMode === 'PYQ'
                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              {activeMode === 'PYQ' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-900">Previous Year Papers</div>
              <div className="text-xs text-slate-500 mt-0.5">Attempt official solved question papers by year and shift</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('AI'); setErrorMessage(''); }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeMode === 'AI'
                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              {activeMode === 'AI' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-slate-900">AI Test Generation</div>
              <div className="text-xs text-slate-500 mt-0.5">Generate high-yield questions with Gemini AI</div>
            </div>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Creation Error</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Shortage Warning */}
        {warningMessage && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Question Bank Availability Notice</div>
              <div>{warningMessage}</div>
            </div>
          </div>
        )}

        {/* MODE A: PREVIOUS YEAR PAPERS */}
        {activeMode === 'PYQ' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Exam Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Examination
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {filteredExams.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Available Official Papers */}
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Available Solved Question Papers
              </h3>
              <div className="space-y-3">
                {papers.map(p => (
                  <label
                    key={p.id}
                    className={`block p-4 rounded-xl border transition cursor-pointer ${
                      selectedPaperId === p.id
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="pyq_paper"
                          value={p.id}
                          checked={selectedPaperId === p.id}
                          onChange={() => setSelectedPaperId(p.id)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{p.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Year: {p.year} • {p.shift || 'Official Shift'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 italic">
                            Source: {p.sourceProvenance}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-slate-600 shrink-0">
                        <div>{p.totalQuestions} Questions</div>
                        <div className="text-indigo-600 font-bold">{p.durationMinutes} mins</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE B: CUSTOM PRACTICE TEST */}
        {activeMode === 'CUSTOM' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            {/* Exam & Subject Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Exam Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Specific Examination
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {filteredExams.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Subject (Filtered by Syllabus)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Topic Selection Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Topics (Optional — Leave blank for all topics)
                </label>
                {topics.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : topics.map(t => t.id))}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topics.map(t => {
                    const isSelected = selectedTopics.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTopic(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No specific sub-topics for this subject.</div>
              )}
            </div>

            {/* Test Configuration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Questions Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  <option value={5}>5 Questions (Quick Test)</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={25}>25 Questions (Standard Section)</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  <option value="Mixed">Mixed (Standard Exam)</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Negative Marking
                </label>
                <select
                  value={negativeMarking ? 'yes' : 'no'}
                  onChange={(e) => setNegativeMarking(e.target.value === 'yes')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  <option value="yes">Enabled (-0.50 Marks)</option>
                  <option value="no">Disabled (No Penalty)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Custom Test Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. SSC CGL Reasoning Revision Test - 25 Questions"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
            </div>
          </div>
        )}

        {/* MODE C: AI TEST GENERATION */}
        {activeMode === 'AI' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            {!aiConfigured && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Gemini API Notice</span>
                </div>
                <div className="mt-1 text-slate-600">
                  {aiMessage || 'GEMINI_API_KEY is currently running in local preview mode. Add your GEMINI_API_KEY to .env.local to enable real-time generative question creation.'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Exam
                </label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {allExams.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  <option value={3}>3 Questions (Fast Demo)</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Specific Topic / Instructions for Gemini AI
              </label>
              <textarea
                rows={3}
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="e.g. Focus on latest SSC pattern number series, coding-decoding, and direction tests with tricky distractors."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={aiGenerating}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Questions with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Question Set</span>
                </>
              )}
            </button>

            {/* Generated AI Questions Preview & Review */}
            {aiQuestions.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Review Generated Questions ({aiQuestions.length})
                  </h3>
                  <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    AI Generated Draft
                  </span>
                </div>

                <div className="space-y-4">
                  {aiQuestions.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs font-bold text-slate-900">
                          Q{qIndex + 1}. {q.questionText}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAiQuestion(qIndex)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
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
                            {opt.id === q.correctAnswer && (
                              <span className="ml-1 text-emerald-600 text-[10px] font-bold">(Correct)</span>
                            )}
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
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => handleCreateTest(false)}
            disabled={isSubmitting || (activeMode === 'AI' && aiQuestions.length === 0)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Schedule for Later</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateTest(true)}
            disabled={isSubmitting || (activeMode === 'AI' && aiQuestions.length === 0)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm shadow-indigo-600/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Test...</span>
              </>
            ) : (
              <>
                <span>Start Test Immediately</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

