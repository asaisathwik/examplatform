import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  initialCategories,
  initialExams,
  initialSubjects,
  initialTopics,
  initialExamSubjects,
  initialQuestions,
  initialPapers
} from '../data/initialData.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Development Demo Account
export const DEMO_USER = {
  id: 'u-demo-sathwik-001',
  email: 'andhe.saisathwik007@gmail.com',
  displayName: 'Sai Sathwik',
  role: 'student',
  timezone: 'Asia/Kolkata',
  // SHA-256 hash of "Sathwik@007"
  passwordHash: hashPassword('Sathwik@007'),
  createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
};

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_exampilot_salt').digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// In-memory cache for fast dev cycles
let dbCache = null;

function ensureDbFile() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Initial state
    const initialDb = {
      users: [DEMO_USER],
      categories: initialCategories,
      exams: initialExams,
      subjects: initialSubjects,
      topics: initialTopics,
      examSubjects: initialExamSubjects,
      questions: initialQuestions,
      papers: initialPapers,
      tests: [],
      testQuestions: [],
      scheduledTests: [],
      attempts: [],
      attemptAnswers: [],
      documents: []
    };

    // Pre-create standard tests from sample papers
    initialPapers.forEach(paper => {
      const testId = `test-${paper.id}`;
      const questionsForPaper = initialQuestions.filter(q => paper.questionIds.includes(q.id));
      
      initialDb.tests.push({
        id: testId,
        title: paper.title,
        examId: paper.examId,
        testType: 'PYQ',
        durationMinutes: paper.durationMinutes,
        totalQuestions: questionsForPaper.length,
        totalMarks: paper.totalMarks,
        negativeMarking: paper.negativeMarking,
        negativeMarksPerQ: paper.negativeMarksPerQ,
        marksPerQ: paper.marksPerQ,
        shuffleQuestions: false,
        shuffleOptions: false,
        createdBy: DEMO_USER.id,
        isPublic: true,
        metadata: {
          paperId: paper.id,
          year: paper.year,
          shift: paper.shift,
          source: paper.sourceProvenance
        },
        createdAt: new Date().toISOString()
      });

      questionsForPaper.forEach((q, idx) => {
        initialDb.testQuestions.push({
          id: `tq-${testId}-${idx}`,
          testId: testId,
          questionId: q.id,
          orderIndex: idx + 1,
          questionSnapshot: { ...q }
        });
      });
    });

    // Create an initial sample completed attempt for demo analytics
    const sampleTest = initialDb.tests[0];
    if (sampleTest) {
      const attemptId = 'att-demo-001';
      const now = new Date();
      const startedAt = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
      const submittedAt = now.toISOString();

      initialDb.attempts.push({
        id: attemptId,
        testId: sampleTest.id,
        userId: DEMO_USER.id,
        startedAt,
        deadlineAt: new Date(now.getTime() + 35 * 60 * 1000).toISOString(),
        submittedAt,
        status: 'COMPLETED',
        timeTakenSeconds: 1500, // 25 mins
        totalQuestions: 25,
        correctAnswers: 21,
        incorrectAnswers: 3,
        unanswered: 1,
        marksObtained: 40.5, // 21 * 2 - 3 * 0.5
        maxMarks: 50,
        accuracyPercentage: 87.5, // 21 / 24 * 100
        scorePercentage: 81.0,
        createdAt: submittedAt
      });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    dbCache = initialDb;
  }
}

export function getDb() {
  ensureDbFile();
  if (!dbCache) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
    } catch (e) {
      dbCache = null;
      ensureDbFile();
    }
  }
  return dbCache;
}

export function saveDb(data) {
  dbCache = data;
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------- DB Operations -----------------

export function findUserByEmail(email) {
  const db = getDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  const db = getDb();
  return db.users.find(u => u.id === id);
}

export function createUser(userData) {
  const db = getDb();
  const newUser = {
    id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: userData.email,
    displayName: userData.displayName || userData.email.split('@')[0],
    role: 'student',
    timezone: userData.timezone || 'Asia/Kolkata',
    passwordHash: hashPassword(userData.password),
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function updateUserProfile(userId, updates) {
  const db = getDb();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  if (updates.displayName) db.users[userIndex].displayName = updates.displayName;
  if (updates.timezone) db.users[userIndex].timezone = updates.timezone;
  if (updates.password) db.users[userIndex].passwordHash = hashPassword(updates.password);

  saveDb(db);
  return db.users[userIndex];
}

// Exams & Syllabus
export function getCategories() {
  return getDb().categories;
}

export function getExams(categoryId = null) {
  const db = getDb();
  if (!categoryId) return db.exams;
  return db.exams.filter(e => e.categoryId === categoryId);
}

export function getExamById(examId) {
  return getDb().exams.find(e => e.id === examId);
}

export function getSubjects(examId = null) {
  const db = getDb();
  if (!examId) return db.subjects;

  const examSubjectMappings = db.examSubjects.filter(es => es.examId === examId);
  if (examSubjectMappings.length === 0) return db.subjects;

  const subjectIds = examSubjectMappings.map(es => es.subjectId);
  return db.subjects.filter(s => subjectIds.includes(s.id));
}

export function getTopics(subjectId = null) {
  const db = getDb();
  if (!subjectId) return db.topics;
  return db.topics.filter(t => t.subjectId === subjectId);
}

// Question Bank
export function getQuestions(filters = {}) {
  const db = getDb();
  let list = db.questions;

  if (filters.examId) {
    list = list.filter(q => q.examId === filters.examId);
  }
  if (filters.subjectId) {
    list = list.filter(q => q.subjectId === filters.subjectId);
  }
  if (filters.topicId) {
    list = list.filter(q => q.topicId === filters.topicId);
  }
  if (filters.difficulty && filters.difficulty !== 'All' && filters.difficulty !== 'Mixed') {
    list = list.filter(q => q.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
  }
  if (filters.sourceType) {
    list = list.filter(q => q.sourceType === filters.sourceType);
  }
  if (filters.year) {
    list = list.filter(q => q.year === parseInt(filters.year));
  }
  if (filters.verificationStatus) {
    list = list.filter(q => q.verificationStatus === filters.verificationStatus);
  }

  return list;
}

export function addQuestions(newQuestions) {
  const db = getDb();
  newQuestions.forEach(q => {
    db.questions.push({
      id: q.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceType: q.sourceType || 'AI_GENERATED',
      examId: q.examId || null,
      subjectId: q.subjectId || null,
      topicId: q.topicId || null,
      year: q.year || new Date().getFullYear(),
      paperName: q.paperName || 'Generated Practice Set',
      difficulty: q.difficulty || 'Medium',
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks || 2,
      negativeMarks: q.negativeMarks || 0.5,
      sourceName: q.sourceName || 'AI Generated',
      sourceUrl: q.sourceUrl || '',
      verificationStatus: q.verificationStatus || 'AI_DRAFT',
      createdBy: q.createdBy || null,
      createdAt: new Date().toISOString()
    });
  });
  saveDb(db);
  return newQuestions;
}

// Papers
export function getPapers(filters = {}) {
  const db = getDb();
  let list = db.papers;
  if (filters.examId) {
    list = list.filter(p => p.examId === filters.examId);
  }
  if (filters.year) {
    list = list.filter(p => p.year === parseInt(filters.year));
  }
  return list;
}

// Tests
export function createTest(testData, questionItems) {
  const db = getDb();
  const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newTest = {
    id: testId,
    title: testData.title,
    examId: testData.examId || null,
    testType: testData.testType || 'CUSTOM',
    subjectId: testData.subjectId || null,
    durationMinutes: parseInt(testData.durationMinutes) || 30,
    totalQuestions: questionItems.length,
    totalMarks: testData.totalMarks || (questionItems.length * (testData.marksPerQ || 2)),
    negativeMarking: testData.negativeMarking !== false,
    negativeMarksPerQ: testData.negativeMarksPerQ !== undefined ? parseFloat(testData.negativeMarksPerQ) : 0.5,
    marksPerQ: testData.marksPerQ ? parseFloat(testData.marksPerQ) : 2,
    shuffleQuestions: !!testData.shuffleQuestions,
    shuffleOptions: !!testData.shuffleOptions,
    createdBy: testData.createdBy || DEMO_USER.id,
    isPublic: !!testData.isPublic,
    metadata: testData.metadata || {},
    createdAt: new Date().toISOString()
  };

  db.tests.push(newTest);

  // Link questions with snapshot freeze
  questionItems.forEach((q, idx) => {
    db.testQuestions.push({
      id: `tq-${testId}-${idx}`,
      testId: testId,
      questionId: q.id,
      orderIndex: idx + 1,
      questionSnapshot: { ...q }
    });
  });

  saveDb(db);
  return { ...newTest, questions: questionItems };
}

export function getTestById(testId) {
  const db = getDb();
  const test = db.tests.find(t => t.id === testId);
  if (!test) return null;

  const tq = db.testQuestions
    .filter(tq => tq.testId === testId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const questions = tq.map(item => item.questionSnapshot);
  return { ...test, questions };
}

// Scheduled Tests
export function scheduleTest(testId, userId, scheduledFor, durationMinutes) {
  const db = getDb();
  const scheduleId = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    id: scheduleId,
    testId,
    userId,
    scheduledFor: new Date(scheduledFor).toISOString(),
    durationMinutes: parseInt(durationMinutes),
    status: 'SCHEDULED',
    createdAt: new Date().toISOString()
  };
  db.scheduledTests.push(record);
  saveDb(db);
  return record;
}

export function getScheduledTests(userId) {
  const db = getDb();
  const now = new Date();
  return db.scheduledTests
    .filter(st => st.userId === userId)
    .map(st => {
      const test = db.tests.find(t => t.id === st.testId);
      const exam = test ? db.exams.find(e => e.id === test.examId) : null;
      const scheduledTime = new Date(st.scheduledFor);
      
      // Auto-update status if scheduled time has arrived and was SCHEDULED
      let currentStatus = st.status;
      if (currentStatus === 'SCHEDULED' && scheduledTime <= now) {
        currentStatus = 'AVAILABLE';
      }

      return {
        ...st,
        status: currentStatus,
        testTitle: test ? test.title : 'Custom Test',
        examName: exam ? exam.name : 'Competitive Exam',
        testDuration: test ? test.durationMinutes : st.durationMinutes,
        totalQuestions: test ? test.totalQuestions : 0,
        totalMarks: test ? test.totalMarks : 0
      };
    })
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
}

export function updateScheduledTest(scheduleId, userId, updates) {
  const db = getDb();
  const index = db.scheduledTests.findIndex(st => st.id === scheduleId && st.userId === userId);
  if (index === -1) return null;

  if (updates.scheduledFor) db.scheduledTests[index].scheduledFor = new Date(updates.scheduledFor).toISOString();
  if (updates.status) db.scheduledTests[index].status = updates.status;

  saveDb(db);
  return db.scheduledTests[index];
}

export function deleteScheduledTest(scheduleId, userId) {
  const db = getDb();
  const index = db.scheduledTests.findIndex(st => st.id === scheduleId && st.userId === userId);
  if (index === -1) return false;

  db.scheduledTests.splice(index, 1);
  saveDb(db);
  return true;
}

// Test Attempts Engine
export function startAttempt(testId, userId, scheduledTestId = null) {
  const db = getDb();
  const test = db.tests.find(t => t.id === testId);
  if (!test) throw new Error('Test not found');

  const tqList = db.testQuestions
    .filter(item => item.testId === testId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const durationMs = (test.durationMinutes || 30) * 60 * 1000;
  const deadlineAt = new Date(now.getTime() + durationMs).toISOString();

  const attempt = {
    id: attemptId,
    testId,
    userId,
    scheduledTestId,
    startedAt: now.toISOString(),
    deadlineAt,
    submittedAt: null,
    status: 'IN_PROGRESS',
    timeTakenSeconds: 0,
    totalQuestions: tqList.length,
    correctAnswers: 0,
    incorrectAnswers: 0,
    unanswered: tqList.length,
    marksObtained: 0,
    maxMarks: test.totalMarks,
    accuracyPercentage: null,
    scorePercentage: 0,
    createdAt: now.toISOString()
  };

  db.attempts.push(attempt);

  // Initialize blank answer state for each question
  tqList.forEach((item, index) => {
    db.attemptAnswers.push({
      id: `ans-${attemptId}-${index}`,
      attemptId,
      questionId: item.questionId,
      orderIndex: item.orderIndex,
      selectedOption: null,
      status: index === 0 ? 'NOT_ANSWERED' : 'NOT_VISITED', // 1st question is visited
      isCorrect: null,
      marksAwarded: 0,
      timeSpentSeconds: 0,
      updatedAt: now.toISOString()
    });
  });

  // If this was from a scheduled test, mark scheduled test as IN_PROGRESS
  if (scheduledTestId) {
    const stIndex = db.scheduledTests.findIndex(st => st.id === scheduledTestId);
    if (stIndex !== -1) {
      db.scheduledTests[stIndex].status = 'IN_PROGRESS';
    }
  }

  saveDb(db);

  const remainingSeconds = Math.max(0, Math.floor((new Date(deadlineAt) - now) / 1000));
  return {
    attempt,
    test,
    questions: tqList.map(item => item.questionSnapshot),
    answers: db.attemptAnswers.filter(a => a.attemptId === attemptId),
    remainingSeconds
  };
}

export function getAttemptState(attemptId, userId) {
  const db = getDb();
  const attempt = db.attempts.find(a => a.id === attemptId && a.userId === userId);
  if (!attempt) return null;

  const test = db.tests.find(t => t.id === attempt.testId);
  const tqList = db.testQuestions
    .filter(item => item.testId === attempt.testId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const answers = db.attemptAnswers
    .filter(a => a.attemptId === attemptId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const now = new Date();
  const deadline = new Date(attempt.deadlineAt);
  const remainingSeconds = Math.max(0, Math.floor((deadline - now) / 1000));

  // If time has expired and attempt is still IN_PROGRESS, auto-submit
  if (remainingSeconds <= 0 && attempt.status === 'IN_PROGRESS') {
    return submitAttempt(attemptId, userId, answers, true);
  }

  return {
    attempt,
    test,
    questions: tqList.map(item => item.questionSnapshot),
    answers,
    remainingSeconds
  };
}

export function updateAttemptAnswer(attemptId, userId, { orderIndex, selectedOption, status, timeSpentSeconds }) {
  const db = getDb();
  const attempt = db.attempts.find(a => a.id === attemptId && a.userId === userId);
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status !== 'IN_PROGRESS') throw new Error('Attempt is already finalized');

  // Check deadline
  const now = new Date();
  if (now > new Date(attempt.deadlineAt)) {
    // Deadline passed, auto-submit
    return submitAttempt(attemptId, userId, [], true);
  }

  const ansIndex = db.attemptAnswers.findIndex(a => a.attemptId === attemptId && a.orderIndex === orderIndex);
  if (ansIndex === -1) throw new Error('Answer slot not found');

  const curr = db.attemptAnswers[ansIndex];
  if (selectedOption !== undefined) curr.selectedOption = selectedOption;
  if (status) curr.status = status;
  if (timeSpentSeconds) curr.timeSpentSeconds = (curr.timeSpentSeconds || 0) + timeSpentSeconds;
  curr.updatedAt = now.toISOString();

  saveDb(db);
  return curr;
}

export function submitAttempt(attemptId, userId, liveAnswers = [], isAutoExpired = false) {
  const db = getDb();
  const attempt = db.attempts.find(a => a.id === attemptId && a.userId === userId);
  if (!attempt) throw new Error('Attempt not found');

  // Idempotent: If already submitted, return saved result immediately
  if (attempt.status === 'COMPLETED' || attempt.status === 'EXPIRED') {
    return getAttemptResult(attemptId, userId);
  }

  const test = db.tests.find(t => t.id === attempt.testId);
  const tqList = db.testQuestions
    .filter(item => item.testId === attempt.testId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // If client sent latest answer batch, merge it
  if (liveAnswers && liveAnswers.length > 0) {
    liveAnswers.forEach(ans => {
      const idx = db.attemptAnswers.findIndex(a => a.attemptId === attemptId && a.orderIndex === ans.orderIndex);
      if (idx !== -1) {
        if (ans.selectedOption !== undefined) db.attemptAnswers[idx].selectedOption = ans.selectedOption;
        if (ans.status) db.attemptAnswers[idx].status = ans.status;
      }
    });
  }

  const savedAnswers = db.attemptAnswers.filter(a => a.attemptId === attemptId);

  // Authoritative scoring
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalMarksAwarded = 0;

  const marksPerQ = test.marksPerQ || 2;
  const negMarksPerQ = test.negativeMarking ? (test.negativeMarksPerQ || 0.5) : 0;

  tqList.forEach(tq => {
    const qSnapshot = tq.questionSnapshot;
    const ans = savedAnswers.find(a => a.orderIndex === tq.orderIndex);
    const selected = ans ? ans.selectedOption : null;

    if (!selected) {
      unansweredCount++;
      if (ans) {
        ans.isCorrect = null;
        ans.marksAwarded = 0;
      }
    } else if (selected.trim().toUpperCase() === qSnapshot.correctAnswer.trim().toUpperCase()) {
      correctCount++;
      totalMarksAwarded += marksPerQ;
      if (ans) {
        ans.isCorrect = true;
        ans.marksAwarded = marksPerQ;
      }
    } else {
      incorrectCount++;
      totalMarksAwarded -= negMarksPerQ;
      if (ans) {
        ans.isCorrect = false;
        ans.marksAwarded = -negMarksPerQ;
      }
    }
  });

  const now = new Date();
  const startTime = new Date(attempt.startedAt);
  const elapsedSec = Math.max(1, Math.min(
    Math.floor((now - startTime) / 1000),
    (test.durationMinutes || 30) * 60
  ));

  const totalAttempted = correctCount + incorrectCount;
  const accuracy = totalAttempted > 0 ? parseFloat(((correctCount / totalAttempted) * 100).toFixed(2)) : null;
  const scorePercent = test.totalMarks > 0 ? parseFloat(((Math.max(0, totalMarksAwarded) / test.totalMarks) * 100).toFixed(2)) : 0;

  attempt.status = isAutoExpired ? 'EXPIRED' : 'COMPLETED';
  attempt.submittedAt = now.toISOString();
  attempt.timeTakenSeconds = elapsedSec;
  attempt.correctAnswers = correctCount;
  attempt.incorrectAnswers = incorrectCount;
  attempt.unanswered = unansweredCount;
  attempt.marksObtained = parseFloat(totalMarksAwarded.toFixed(2));
  attempt.accuracyPercentage = accuracy;
  attempt.scorePercentage = scorePercent;

  // Mark scheduled test as COMPLETED if linked
  if (attempt.scheduledTestId) {
    const stIndex = db.scheduledTests.findIndex(st => st.id === attempt.scheduledTestId);
    if (stIndex !== -1) {
      db.scheduledTests[stIndex].status = 'COMPLETED';
    }
  }

  saveDb(db);

  return getAttemptResult(attemptId, userId);
}

export function getAttemptResult(attemptId, userId) {
  const db = getDb();
  const attempt = db.attempts.find(a => a.id === attemptId && a.userId === userId);
  if (!attempt) return null;

  const test = db.tests.find(t => t.id === attempt.testId);
  const exam = test ? db.exams.find(e => e.id === test.examId) : null;
  const subject = test ? db.subjects.find(s => s.id === test.subjectId) : null;

  const tqList = db.testQuestions
    .filter(item => item.testId === attempt.testId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const answers = db.attemptAnswers.filter(a => a.attemptId === attemptId);

  // Build question review with full explanations and options
  const questionReviews = tqList.map(tq => {
    const ans = answers.find(a => a.orderIndex === tq.orderIndex);
    return {
      orderIndex: tq.orderIndex,
      question: tq.questionSnapshot,
      selectedOption: ans ? ans.selectedOption : null,
      status: ans ? ans.status : 'NOT_VISITED',
      isCorrect: ans ? ans.isCorrect : null,
      marksAwarded: ans ? ans.marksAwarded : 0,
      timeSpentSeconds: ans ? ans.timeSpentSeconds : 0
    };
  });

  // Calculate topic-wise breakdown
  const topicMap = {};
  questionReviews.forEach(qr => {
    const topicId = qr.question.topicId || 'general';
    const topicObj = db.topics.find(t => t.id === topicId);
    const topicName = topicObj ? topicObj.name : (qr.question.topic || 'General Practice');

    if (!topicMap[topicId]) {
      topicMap[topicId] = {
        topicName,
        totalQuestions: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        accuracy: 0
      };
    }

    topicMap[topicId].totalQuestions++;
    if (qr.isCorrect === true) topicMap[topicId].correct++;
    else if (qr.isCorrect === false) topicMap[topicId].incorrect++;
    else topicMap[topicId].unanswered++;
  });

  const topicPerformance = Object.values(topicMap).map(t => {
    const attempted = t.correct + t.incorrect;
    return {
      ...t,
      accuracy: attempted > 0 ? parseFloat(((t.correct / attempted) * 100).toFixed(1)) : 0
    };
  });

  return {
    attempt,
    test,
    exam,
    subject,
    topicPerformance,
    questionReviews
  };
}

export function getUserAttempts(userId, filters = {}) {
  const db = getDb();
  let list = db.attempts.filter(a => a.userId === userId && a.status !== 'IN_PROGRESS');

  return list
    .map(a => {
      const test = db.tests.find(t => t.id === a.testId);
      const exam = test ? db.exams.find(e => e.id === test.examId) : null;
      const subject = test ? db.subjects.find(s => s.id === test.subjectId) : null;

      return {
        ...a,
        testTitle: test ? test.title : 'Examination Test',
        testType: test ? test.testType : 'CUSTOM',
        examName: exam ? exam.name : 'Competitive Exam',
        examCategory: exam ? exam.categoryId : 'SSC',
        subjectName: subject ? subject.name : 'Multiple Subjects',
        durationMinutes: test ? test.durationMinutes : 30
      };
    })
    .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
}

// User Analytics
export function getUserAnalytics(userId) {
  const attempts = getUserAttempts(userId);
  const db = getDb();

  if (attempts.length === 0) {
    return {
      totalTests: 0,
      avgScore: 0,
      highestScore: 0,
      overallAccuracy: 0,
      totalPracticeMinutes: 0,
      scoreTrends: [],
      subjectBreakdown: [],
      strongTopics: [],
      weakTopics: [],
      recentActivity: []
    };
  }

  const totalTests = attempts.length;
  const totalScorePercent = attempts.reduce((acc, curr) => acc + (curr.scorePercentage || 0), 0);
  const avgScore = parseFloat((totalScorePercent / totalTests).toFixed(1));
  const highestScore = Math.max(...attempts.map(a => a.scorePercentage || 0));

  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSecs = 0;

  attempts.forEach(a => {
    totalCorrect += (a.correctAnswers || 0);
    totalIncorrect += (a.incorrectAnswers || 0);
    totalSecs += (a.timeTakenSeconds || 0);
  });

  const overallAttempted = totalCorrect + totalIncorrect;
  const overallAccuracy = overallAttempted > 0 ? parseFloat(((totalCorrect / overallAttempted) * 100).toFixed(1)) : 0;
  const totalPracticeMinutes = Math.round(totalSecs / 60);

  // Score Trends (Chronological)
  const scoreTrends = [...attempts]
    .reverse()
    .slice(-10)
    .map(a => ({
      date: new Date(a.submittedAt || a.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: a.scorePercentage || 0,
      accuracy: a.accuracyPercentage || 0,
      title: a.testTitle
    }));

  // Subject breakdown
  const subjectMap = {};
  attempts.forEach(a => {
    const sName = a.subjectName || 'General Practice';
    if (!subjectMap[sName]) {
      subjectMap[sName] = { name: sName, attempts: 0, totalScore: 0, accuracyTotal: 0 };
    }
    subjectMap[sName].attempts++;
    subjectMap[sName].totalScore += (a.scorePercentage || 0);
    subjectMap[sName].accuracyTotal += (a.accuracyPercentage || 0);
  });

  const subjectBreakdown = Object.values(subjectMap).map(s => ({
    name: s.name,
    testsAttempted: s.attempts,
    avgScore: parseFloat((s.totalScore / s.attempts).toFixed(1)),
    avgAccuracy: parseFloat((s.accuracyTotal / s.attempts).toFixed(1))
  }));

  // Strong & Weak topics based on answers
  const allAttemptIds = attempts.map(a => a.id);
  const userAnswers = db.attemptAnswers.filter(ans => allAttemptIds.includes(ans.attemptId));
  
  const topicStats = {};
  userAnswers.forEach(ans => {
    const q = db.questions.find(item => item.id === ans.questionId);
    if (!q) return;

    const topicId = q.topicId || 'general';
    const topicObj = db.topics.find(t => t.id === topicId);
    const topicName = topicObj ? topicObj.name : 'General Topics';

    if (!topicStats[topicName]) {
      topicStats[topicName] = { topicName, correct: 0, total: 0 };
    }
    if (ans.selectedOption) {
      topicStats[topicName].total++;
      if (ans.isCorrect) topicStats[topicName].correct++;
    }
  });

  const evaluatedTopics = Object.values(topicStats)
    .filter(t => t.total >= 1)
    .map(t => ({
      ...t,
      accuracy: parseFloat(((t.correct / t.total) * 100).toFixed(1))
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const strongTopics = evaluatedTopics.filter(t => t.accuracy >= 70).slice(0, 5);
  const weakTopics = evaluatedTopics.filter(t => t.accuracy < 70).slice(-5).reverse();

  return {
    totalTests,
    avgScore,
    highestScore,
    overallAccuracy,
    totalPracticeMinutes,
    scoreTrends,
    subjectBreakdown,
    strongTopics,
    weakTopics,
    recentActivity: attempts.slice(0, 5)
  };
}

// Uploaded Documents
export function saveUploadedDocument(userId, doc) {
  const db = getDb();
  const newDoc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    fileName: doc.fileName,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    fileUrl: doc.fileUrl || '',
    storagePath: doc.storagePath || '',
    processingMode: doc.processingMode,
    status: doc.status || 'UPLOADED',
    extractedData: doc.extractedData || {},
    createdAt: new Date().toISOString()
  };

  db.documents.push(newDoc);
  saveDb(db);
  return newDoc;
}

export function getUploadedDocuments(userId) {
  const db = getDb();
  return db.documents.filter(d => d.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
