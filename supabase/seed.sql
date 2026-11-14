-- ====================================================================
-- EXAMPILOT SEED DATA
-- Categories, Exams, Subjects, Topics, Syllabus Mappings, and Sample Questions
-- All UUIDs strictly use unique, valid hexadecimal characters [0-9, a-f]
-- ====================================================================

-- 1. EXAM CATEGORIES
INSERT INTO public.exam_categories (id, name, code, description, icon, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'SSC', 'SSC', 'Staff Selection Commission exams including CGL, CHSL, MTS, CPO', 'BookOpen', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Banking', 'BANK', 'Banking exams like IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI', 'Landmark', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Railway / RRB', 'RRB', 'Railway Recruitment Board exams like NTPC, Group D, ALP', 'Train', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Insurance', 'INS', 'Insurance recruitments like LIC AAO, LIC Assistant, NIACL AO', 'ShieldCheck', 4),
  ('c1000000-0000-0000-0000-000000000005', 'UPSC', 'UPSC', 'Union Public Service Commission Civil Services Prelims', 'Award', 5),
  ('c1000000-0000-0000-0000-000000000006', 'State PSC / Groups', 'STATE_PSC', 'State Public Service Commission Group 1, Group 2, Group 3', 'GraduationCap', 6),
  ('c1000000-0000-0000-0000-000000000007', 'SI / Police Constable', 'POLICE', 'State Level Sub-Inspector and Police Constable examinations', 'Shield', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Other', 'OTHER', 'Other national and state level competitive recruitment tests', 'Layers', 8)
ON CONFLICT (id) DO NOTHING;

-- 2. EXAMS (Unique IDs: e1000000-0000-0000-0000-000000000001 to 0008)
INSERT INTO public.exams (id, category_id, name, code, description, total_time_minutes, default_marks_per_q, default_neg_marks)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'SSC CGL (Tier 1)', 'SSC_CGL', 'Combined Graduate Level Examination Tier 1', 60, 2.00, 0.50),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'SSC CHSL (Tier 1)', 'SSC_CHSL', 'Combined Higher Secondary Level Tier 1', 60, 2.00, 0.50),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'SSC MTS', 'SSC_MTS', 'Multi-Tasking Staff and Havaldar', 90, 3.00, 1.00),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'SSC CPO (Tier 1)', 'SSC_CPO', 'Central Police Organization Sub-Inspector', 120, 1.00, 0.25),
  ('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'IBPS PO (Prelims)', 'IBPS_PO', 'Institute of Banking Personnel Selection PO Prelims', 60, 1.00, 0.25),
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'SBI PO (Prelims)', 'SBI_PO', 'State Bank of India Probationary Officer Prelims', 60, 1.00, 0.25),
  ('e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'RRB NTPC (CBT 1)', 'RRB_NTPC', 'Non-Technical Popular Categories Stage 1', 90, 1.00, 0.33),
  ('e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000005', 'UPSC Prelims (GS Paper 1)', 'UPSC_CSE_P1', 'Civil Services Examination General Studies Paper 1', 120, 2.00, 0.66)
ON CONFLICT (id) DO NOTHING;

-- 3. SUBJECTS (Unique IDs: b1000000-0000-0000-0000-000000000001 to 0006)
INSERT INTO public.subjects (id, name, code, description)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Quantitative Aptitude / Arithmetic', 'QUANT', 'Mathematical and numerical aptitude'),
  ('b1000000-0000-0000-0000-000000000002', 'Reasoning Ability', 'REASONING', 'Logical, verbal, and analytical reasoning'),
  ('b1000000-0000-0000-0000-000000000003', 'English Language', 'ENGLISH', 'Grammar, vocabulary, and reading comprehension'),
  ('b1000000-0000-0000-0000-000000000004', 'General Awareness', 'GA', 'Current affairs, static GK, history, polity, geography, science'),
  ('b1000000-0000-0000-0000-000000000005', 'Banking Awareness', 'BANK_AWARE', 'Financial awareness and banking regulations'),
  ('b1000000-0000-0000-0000-000000000006', 'Computer Knowledge', 'COMPUTER', 'Computer fundamentals, networking, MS Office, OS')
ON CONFLICT (id) DO NOTHING;

-- 4. TOPICS (Unique IDs: d1000000-0000-0000-0000-000000000001 to 0023)
INSERT INTO public.topics (id, subject_id, name, code)
VALUES
  -- Quantitative Aptitude
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Percentages', 'PERCENTAGES'),
  ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Ratio and Proportion', 'RATIO_PROP'),
  ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Profit and Loss', 'PROFIT_LOSS'),
  ('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'Simple and Compound Interest', 'SI_CI'),
  ('d1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Time and Work', 'TIME_WORK'),
  ('d1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Time-Speed-Distance', 'TSD'),
  ('d1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'Averages', 'AVERAGES'),
  ('d1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'Number System', 'NUMBER_SYSTEM'),
  -- Reasoning
  ('d1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'Analogy', 'ANALOGY'),
  ('d1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'Coding-Decoding', 'CODING_DECODING'),
  ('d1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002', 'Series (Number & Alphabet)', 'SERIES'),
  ('d1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000002', 'Blood Relations', 'BLOOD_RELATIONS'),
  ('d1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000002', 'Direction Sense', 'DIRECTION_SENSE'),
  ('d1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000002', 'Syllogism', 'SYLLOGISM'),
  ('d1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000002', 'Seating Arrangement', 'SEATING_ARRANGEMENT'),
  -- English
  ('d1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000003', 'Grammar & Error Detection', 'GRAMMAR_ERROR'),
  ('d1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000003', 'Vocabulary & Synonyms/Antonyms', 'VOCABULARY'),
  ('d1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000003', 'Reading Comprehension', 'RC'),
  ('d1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000003', 'Cloze Test', 'CLOZE_TEST'),
  -- General Awareness
  ('d1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000004', 'Indian Polity & Constitution', 'POLITY'),
  ('d1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000004', 'Modern Indian History', 'HISTORY'),
  ('d1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000004', 'Geography & Rivers', 'GEOGRAPHY'),
  ('d1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000004', 'General Science', 'SCIENCE')
ON CONFLICT (id) DO NOTHING;

-- 5. EXAM_SUBJECTS (MAPPINGS)
-- SSC CGL: Quant, Reasoning, English, General Awareness
INSERT INTO public.exam_subjects (exam_id, subject_id, question_count, marks_weightage)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 25, 50.00),
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 25, 50.00),
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 25, 50.00),
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 25, 50.00),
  -- IBPS PO: Quant, Reasoning, English
  ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 35, 35.00),
  ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002', 35, 35.00),
  ('e1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003', 30, 30.00)
ON CONFLICT (exam_id, subject_id) DO NOTHING;

-- 6. SAMPLE QUESTIONS (Unique IDs: f1000000-0000-0000-0000-000000000001 to 0004)
INSERT INTO public.questions (
  id, source_type, exam_id, subject_id, topic_id, year, paper_name, difficulty,
  question_text, options, correct_answer, explanation, marks, negative_marks,
  source_name, source_url, verification_status
)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'PYQ',
    'e1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000009',
    2023,
    'SSC CGL 2023 Tier 1 (Shift 1)',
    'Easy',
    'Select the option that is related to the third term in the same way as the second term is related to the first term:

Amnesia : Memory :: Paralysis : ?',
    '[{"id": "A", "text": "Movement"}, {"id": "B", "text": "Sight"}, {"id": "C", "text": "Hearing"}, {"id": "D", "text": "Sleep"}]'::jsonb,
    'A',
    'Amnesia is the loss of memory, while paralysis is the loss of the ability to move (movement).',
    2.00,
    0.50,
    'SSC Official Answer Key 2023',
    'https://ssc.nic.in',
    'VERIFIED'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'PYQ',
    'e1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000011',
    2023,
    'SSC CGL 2023 Tier 1 (Shift 1)',
    'Easy',
    'Which number will replace the question mark (?) in the following series?

7, 11, 19, 31, 47, ?',
    '[{"id": "A", "text": "67"}, {"id": "B", "text": "63"}, {"id": "C", "text": "65"}, {"id": "D", "text": "69"}]'::jsonb,
    'A',
    'Differences: 11-7=4, 19-11=8, 31-19=12, 47-31=16. Next difference is +20: 47+20 = 67.',
    2.00,
    0.50,
    'SSC Official Answer Key 2023',
    'https://ssc.nic.in',
    'VERIFIED'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'PYQ',
    'e1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    2023,
    'SSC CGL 2023 Tier 1',
    'Easy',
    'If the price of sugar is increased by 25%, by how much percent should a household reduce its consumption so that the expenditure remains the same?',
    '[{"id": "A", "text": "20%"}, {"id": "B", "text": "25%"}, {"id": "C", "text": "16.67%"}, {"id": "D", "text": "30%"}]'::jsonb,
    'A',
    'Reduction % = [r / (100 + r)] * 100 = [25 / 125] * 100 = 20%.',
    2.00,
    0.50,
    'SSC CGL 2023 Official Paper',
    'https://ssc.nic.in',
    'VERIFIED'
  ),
  (
    'f1000000-0000-0000-0000-000000000004',
    'PYQ',
    'e1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000004',
    'd1000000-0000-0000-0000-000000000020',
    2023,
    'SSC CGL 2023 Tier 1',
    'Easy',
    'Under which Article of the Constitution of India is the Right to Equality before Law guaranteed?',
    '[{"id": "A", "text": "Article 14"}, {"id": "B", "text": "Article 19"}, {"id": "C", "text": "Article 21"}, {"id": "D", "text": "Article 32"}]'::jsonb,
    'A',
    'Article 14 states that the State shall not deny to any person equality before the law or equal protection of the laws.',
    2.00,
    0.50,
    'SSC CGL 2023 Official Paper',
    'https://ssc.nic.in',
    'VERIFIED'
  )
ON CONFLICT (id) DO NOTHING;
