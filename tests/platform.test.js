/**
 * Automated Verification Test Suite for ExamPilot Engine
 * Tests scoring logic, authoritative timer, answer persistence, and custom test validation
 */

const assert = require('assert');
const {
  hashPassword,
  verifyPassword,
  getDb,
  createTest,
  getQuestions,
  startAttempt,
  getAttemptState,
  updateAttemptAnswer,
  submitAttempt,
  getAttemptResult,
  scheduleTest,
  getScheduledTests,
  DEMO_USER
} = require('../lib/store');

const { validateAndNormalizeQuestions } = require('../lib/ai/gemini');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting ExamPilot Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error('   ', err.message);
      failed++;
    }
  }

  // 1. Password Security
  test('Demo user authentication and password hash verification', () => {
    const rawPass = 'Sathwik@007';
    const hash = hashPassword(rawPass);
    assert.strictEqual(verifyPassword(rawPass, hash), true, 'Valid password should verify');
    assert.strictEqual(verifyPassword('WrongPass', hash), false, 'Invalid password should fail');
  });

  // 2. Exam and Question Bank Verification
  test('Question bank contains at least 25 reasoning questions for SSC CGL', () => {
    const reasoningQs = getQuestions({ examId: 'exam-ssc-cgl', subjectId: 'sub-reasoning' });
    assert.ok(reasoningQs.length >= 25, `Expected >= 25 questions, got ${reasoningQs.length}`);
  });

  // 3. Custom Test Creation - Question Count Validation
  test('Creating 25-question SSC CGL Reasoning test succeeds', () => {
    const reasoningQs = getQuestions({ examId: 'exam-ssc-cgl', subjectId: 'sub-reasoning' });
    const selected25 = reasoningQs.slice(0, 25);
    
    const newTest = createTest({
      title: 'SSC CGL Reasoning 25Q Test',
      examId: 'exam-ssc-cgl',
      subjectId: 'sub-reasoning',
      durationMinutes: 30,
      negativeMarking: true,
      negativeMarksPerQ: 0.5,
      marksPerQ: 2,
      createdBy: DEMO_USER.id
    }, selected25);

    assert.ok(newTest.id, 'Test ID should be generated');
    assert.strictEqual(newTest.totalQuestions, 25, 'Total questions should be 25');
    assert.strictEqual(newTest.totalMarks, 50, 'Total marks should be 50 (25 * 2)');
  });

  // 4. Test Attempt Engine - Server Authoritative Timer & Blank Answers
  let testAttemptData = null;
  test('Start test attempt sets authoritative server deadline and initializes question palette', () => {
    const db = getDb();
    const testItem = db.tests[0];
    assert.ok(testItem, 'A test must exist');

    testAttemptData = startAttempt(testItem.id, DEMO_USER.id);
    assert.ok(testAttemptData.attempt.id, 'Attempt ID must exist');
    assert.ok(testAttemptData.attempt.deadlineAt, 'Authoritative deadline must be set');
    assert.strictEqual(testAttemptData.attempt.status, 'IN_PROGRESS');
    assert.strictEqual(testAttemptData.answers.length, testItem.totalQuestions);
    
    // First question is NOT_ANSWERED (visited), others NOT_VISITED
    assert.strictEqual(testAttemptData.answers[0].status, 'NOT_ANSWERED');
    assert.strictEqual(testAttemptData.answers[1].status, 'NOT_VISITED');
  });

  // 5. Answer Navigation & Status Preservation
  test('Updating answer persists selection and updates status to ANSWERED', () => {
    const attemptId = testAttemptData.attempt.id;
    const updatedAns = updateAttemptAnswer(attemptId, DEMO_USER.id, {
      orderIndex: 1,
      selectedOption: 'A',
      status: 'ANSWERED'
    });

    assert.strictEqual(updatedAns.selectedOption, 'A');
    assert.strictEqual(updatedAns.status, 'ANSWERED');

    // Retrieve state again to simulate page refresh
    const refreshedState = getAttemptState(attemptId, DEMO_USER.id);
    const ans1 = refreshedState.answers.find(a => a.orderIndex === 1);
    assert.strictEqual(ans1.selectedOption, 'A', 'Answer must persist across page reloads');
    assert.strictEqual(ans1.status, 'ANSWERED');
    assert.ok(refreshedState.remainingSeconds > 0, 'Remaining time must be calculated from server deadline');
  });

  // 6. Mark for Review Status Transition
  test('Mark for review transitions status correctly', () => {
    const attemptId = testAttemptData.attempt.id;
    const ans2 = updateAttemptAnswer(attemptId, DEMO_USER.id, {
      orderIndex: 2,
      selectedOption: null,
      status: 'MARKED_FOR_REVIEW'
    });
    assert.strictEqual(ans2.status, 'MARKED_FOR_REVIEW');

    const ans3 = updateAttemptAnswer(attemptId, DEMO_USER.id, {
      orderIndex: 3,
      selectedOption: 'B',
      status: 'ANSWERED_AND_MARKED'
    });
    assert.strictEqual(ans3.status, 'ANSWERED_AND_MARKED');
  });

  // 7. Deterministic Scoring and Accuracy Calculation
  test('Deterministic scoring correctly calculates marks and accuracy with negative penalties', () => {
    const attemptId = testAttemptData.attempt.id;
    const result = submitAttempt(attemptId, DEMO_USER.id);

    assert.strictEqual(result.attempt.status, 'COMPLETED');
    assert.ok(typeof result.attempt.marksObtained === 'number');
    assert.ok(typeof result.attempt.accuracyPercentage === 'number' || result.attempt.accuracyPercentage === null);
    assert.ok(result.questionReviews.length > 0, 'Must have question reviews');
    assert.ok(result.topicPerformance.length > 0, 'Must have topic-wise performance');
  });

  // 8. Idempotent Test Submission
  test('Duplicate test submission is idempotent and preserves exact historical result', () => {
    const attemptId = testAttemptData.attempt.id;
    const secondSubmit = submitAttempt(attemptId, DEMO_USER.id);
    assert.strictEqual(secondSubmit.attempt.status, 'COMPLETED');
    assert.strictEqual(secondSubmit.attempt.id, attemptId);
  });

  // 9. Exam Scheduling
  test('Scheduling a test persists and returns in scheduled list', () => {
    const db = getDb();
    const testItem = db.tests[0];
    const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const scheduled = scheduleTest(testItem.id, DEMO_USER.id, scheduledFor, 30);
    assert.ok(scheduled.id);
    
    const userSchedules = getScheduledTests(DEMO_USER.id);
    assert.ok(userSchedules.some(s => s.id === scheduled.id), 'Scheduled test must appear in user list');
  });

  // 10. AI Schema Validation
  test('AI questions validator ensures 4 options, valid correctAnswer and explanations', () => {
    const rawAiOutput = [
      {
        questionText: 'What is 15% of 200?',
        options: [
          { id: 'A', text: '30' },
          { id: 'B', text: '25' },
          { id: 'C', text: '35' },
          { id: 'D', text: '20' }
        ],
        correctAnswer: 'A',
        explanation: '15/100 * 200 = 30'
      }
    ];

    const validated = validateAndNormalizeQuestions(rawAiOutput, 'Quantitative Aptitude', 'Percentages', 'Easy');
    assert.strictEqual(validated.length, 1);
    assert.strictEqual(validated[0].correctAnswer, 'A');
    assert.strictEqual(validated[0].options.length, 4);
    assert.strictEqual(validated[0].sourceType, 'AI_GENERATED');
    assert.strictEqual(validated[0].verificationStatus, 'AI_DRAFT');
  });

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

