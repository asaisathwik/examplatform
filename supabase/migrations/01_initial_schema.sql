-- ====================================================================
-- EXAMPILOT DATABASE SCHEMA
-- AI-Powered Competitive Exam Preparation Platform
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public profile insert on signup"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. EXAM CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.exam_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exam categories" ON public.exam_categories FOR SELECT USING (true);

-- 3. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.exam_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    total_time_minutes INT DEFAULT 60,
    default_marks_per_q NUMERIC(5,2) DEFAULT 2.00,
    default_neg_marks NUMERIC(5,2) DEFAULT 0.50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exams" ON public.exams FOR SELECT USING (true);

-- 4. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

-- 5. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(subject_id, code)
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);

-- 6. EXAM_SUBJECTS TABLE (Configurable syllabus mappings)
CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    question_count INT DEFAULT 25,
    marks_weightage NUMERIC(5,2) DEFAULT 50.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(exam_id, subject_id)
);

ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exam_subjects" ON public.exam_subjects FOR SELECT USING (true);

-- 7. QUESTIONS TABLE (Complete provenance and verification tracking)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL CHECK (source_type IN ('PYQ', 'AI_GENERATED', 'USER_UPLOADED', 'ADMIN_CREATED', 'DEMO')),
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    year INT,
    paper_name TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of { id: "A", text: "..." }
    correct_answer TEXT NOT NULL, -- "A", "B", "C", or "D"
    explanation TEXT,
    marks NUMERIC(5,2) DEFAULT 2.00,
    negative_marks NUMERIC(5,2) DEFAULT 0.50,
    source_url TEXT,
    source_name TEXT,
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'UNVERIFIED', 'DEMO', 'AI_DRAFT')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON public.questions (exam_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions (topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON public.questions (source_type);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read verified and demo questions or their own"
    ON public.questions FOR SELECT
    USING (verification_status IN ('VERIFIED', 'DEMO') OR created_by = auth.uid());

CREATE POLICY "Users can create own questions"
    ON public.questions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 8. TESTS TABLE
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('PYQ', 'CUSTOM', 'AI_GENERATED', 'DOCUMENT')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    total_questions INT NOT NULL CHECK (total_questions > 0),
    total_marks NUMERIC(6,2) NOT NULL,
    negative_marking BOOLEAN DEFAULT true,
    negative_marks_per_q NUMERIC(5,2) DEFAULT 0.50,
    marks_per_q NUMERIC(5,2) DEFAULT 2.00,
    shuffle_questions BOOLEAN DEFAULT false,
    shuffle_options BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read public tests or their own"
    ON public.tests FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create own tests"
    ON public.tests FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 9. TEST_QUESTIONS TABLE (Question snapshot freeze for historical integrity)
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    order_index INT NOT NULL,
    question_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(test_id, order_index)
);

ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read test questions for accessible tests"
    ON public.test_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tests t 
            WHERE t.id = test_id AND (t.is_public = true OR t.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can insert test questions for own tests"
    ON public.test_questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tests t 
            WHERE t.id = test_id AND t.created_by = auth.uid()
        )
    );

-- 10. SCHEDULED_TESTS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scheduled tests"
    ON public.scheduled_tests FOR ALL
    USING (auth.uid() = user_id);

-- 11. TEST_ATTEMPTS TABLE (Server-authoritative timing and final calculations)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_test_id UUID REFERENCES public.scheduled_tests(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deadline_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'EXPIRED')),
    time_taken_seconds INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    incorrect_answers INT DEFAULT 0,
    unanswered INT DEFAULT 0,
    marks_obtained NUMERIC(6,2) DEFAULT 0.00,
    max_marks NUMERIC(6,2) DEFAULT 0.00,
    accuracy_percentage NUMERIC(5,2),
    score_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own test attempts"
    ON public.test_attempts FOR ALL
    USING (auth.uid() = user_id);

-- 12. ATTEMPT_ANSWERS TABLE (Per-question answers, review flag, live progress)
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    order_index INT NOT NULL,
    selected_option TEXT,
    status TEXT NOT NULL DEFAULT 'NOT_ANSWERED' CHECK (status IN ('NOT_VISITED', 'NOT_ANSWERED', 'ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_AND_MARKED')),
    is_correct BOOLEAN,
    marks_awarded NUMERIC(5,2) DEFAULT 0.00,
    time_spent_seconds INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(attempt_id, order_index)
);

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempt answers"
    ON public.attempt_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.test_attempts a 
            WHERE a.id = attempt_id AND a.user_id = auth.uid()
        )
    );

-- 13. UPLOADED_DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    file_url TEXT,
    storage_path TEXT,
    processing_mode TEXT NOT NULL CHECK (processing_mode IN ('EXTRACT_QUESTIONS', 'GENERATE_FROM_NOTES')),
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'EXTRACTED', 'FAILED')),
    extracted_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own uploaded documents"
    ON public.uploaded_documents FOR ALL
    USING (auth.uid() = user_id);

