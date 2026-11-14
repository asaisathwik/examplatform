# ExamPilot — AI-Powered Competitive Exam Preparation Platform

A responsive full-stack web application designed for aspirants preparing for Indian competitive and government examinations, including **SSC (CGL, CHSL, MTS, CPO)**, **Banking (IBPS PO/Clerk, SBI PO/Clerk)**, **Railway (RRB NTPC, Group D)**, **UPSC Civil Services Prelims**, and State PSCs.

---

## 🌟 Key Product Capabilities

### 1. Three Core Test Taking Modes
- **Previous Year Question Papers (PYQs):** Genuine examination papers with full provenance (Staff Selection Commission, IBPS), official answer keys, and pedagogical step-by-step solutions.
- **Custom Adaptive Practice Tests:** Dynamically filtered by examination syllabus (Quant, Reasoning, English, General Awareness, Banking). Configurable question counts (5, 10, 15, 20, 25, 50), time duration, difficulty (Easy, Medium, Hard, Mixed), and negative marking penalties.
- **AI-Powered Document-to-Test & AI Test Generation:**
  - **Mode 1 (Extract Existing Questions):** Upload question papers (PDF, PNG, JPG). Extracts questions and option keys for review.
  - **Mode 2 (Generate from Notes):** Upload study notes or syllabus guides and synthesize exam-pattern MCQs grounded in the uploaded material using Gemini AI.
  - Review, edit, delete, or regenerate questions before finalizing into an active test.

### 2. High-Fidelity CBT Examination Engine
- Modeled after official CBT (Computer-Based Test) platforms (TCS iON / SSC):
- **Server-Authoritative Timer:** Starts on the backend and enforces a strict deadline. Recalculates remaining time accurately on page reloads or network reconnection without resetting.
- **Question Palette:** Live 5-state indicators:
  - 🟩 Answered
  - 🟥 Visited but Not Answered
  - 🟪 Marked for Review
  - 🟪🟢 Answered & Marked for Review
  - ⬜ Not Visited
- **Answer Persistence:** Instant background persistence so candidate selections are never lost.
- **Auto-Submission on Expiry:** Finalizes test attempts immediately once the deadline passes.
- **Idempotent Submission:** Prevents double submissions or race conditions.

### 3. Detailed Results & Diagnostic Analytics
- **Score Card:** Marks obtained, maximum marks, and score percentage.
- **Accuracy Metric:** Calculated as $\text{Accuracy} = \frac{\text{Correct}}{\text{Correct} + \text{Incorrect}} \times 100$ (handles zero attempts safely).
- **Topic-Wise Breakdown:** Performance grouped by sub-topics to isolate areas of weakness.
- **Question-by-Question Review:** Candidate selection vs. answer key, marks awarded/lost, and in-depth explanations.
- **Attempt History:** Immutable historical records of every test taken.
- **Performance Analytics:** Score trends, subject distributions, and automated focus area recommendations.

---

## 🛠 Technology Stack

- **Frontend & App Framework:** Next.js 14 (App Router, JavaScript/JSX)
- **Styling & UI:** Tailwind CSS, Lucide React icons
- **Backend Route Handlers:** Next.js Route Handlers (`app/api/*`)
- **Authentication:** Supabase Auth with secure local session fallback
- **Database & Storage:** Supabase PostgreSQL with Row Level Security (RLS) policies & persistent dual-mode architecture
- **AI Service:** Google Gemini AI API (`gemini-1.5-flash`)
- **Document Processing:** PDF parsing (`pdf-parse`) and text extraction

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18.17+` or `v20+` or `v22+` (Tested on Node.js v22.16.0)
- npm `v9+` or `v11+`

### 2. Installation
```bash
# Clone or navigate to the project root
cd d:\AI_testing_Platform

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configurable variables:
```env
NEXT_PUBLIC_APP_NAME="ExamPilot"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Cloud Integrations:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

> **Note on Zero-Config Mode:** ExamPilot includes a pre-seeded, high-fidelity local database engine. The login, question bank, test creation, timer, CBT palette, scoring, results, and analytics run immediately even without cloud credentials. When Supabase or Gemini keys are provided in `.env.local`, cloud features activate automatically.

### 4. Development Demo Account
The application is pre-seeded with the required development test account:
- **Email:** `andhe.saisathwik007@gmail.com`
- **Password:** `Sathwik@007`
- **Quick Fill:** The login page includes a one-click **"Fill Credentials"** button for immediate testing.

To re-seed or verify this user:
```bash
npm run setup-user
```

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Unauthenticated visitors are automatically routed to `/login`.

---

## 🗄 Database Design & Supabase Setup

The database schema and migrations are located in `supabase/`:
- `supabase/migrations/01_initial_schema.sql`: Full relational DDL, tables, constraints, foreign keys, indexes, and Row Level Security (RLS) policies.
- `supabase/seed.sql`: Categories, examinations, subjects, syllabus mappings, and question bank.

### Supabase Tables:
1. `profiles`: Candidate profile, email, timezone, and study role.
2. `exam_categories`: SSC, Banking, Railway, Insurance, UPSC, State PSC, Police.
3. `exams`: Exam configurations (time duration, marking schemes, negative penalties).
4. `subjects`: Quantitative Aptitude, Reasoning Ability, English, General Awareness, Banking.
5. `topics`: Syllabi breakdown (Percentages, Number Series, Syllogisms, Polity, etc.).
6. `exam_subjects`: Exam-to-subject weightage mappings.
7. `questions`: Full question bank with provenance metadata (`PYQ`, `AI_GENERATED`, `USER_UPLOADED`), options JSONB, and verification status.
8. `tests`: Created mock tests and configurations.
9. `test_questions`: Question snapshots preserving 100% historical test integrity.
10. `scheduled_tests`: Candidate test schedule calendar with countdowns.
11. `test_attempts`: Authoritative start times, deadlines, scores, and accuracy percentages.
12. `attempt_answers`: Per-question responses and question palette states.
13. `uploaded_documents`: Document logs, extracted text, and AI question sets.

### Running SQL Migrations in Supabase:
1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Paste and run `supabase/migrations/01_initial_schema.sql`.
4. Paste and run `supabase/seed.sql`.
5. Under **Project Settings > API**, copy the project URL and Anon key into your `.env.local`.

---

## 🧪 Running Automated Tests

Run the built-in test suite:
```bash
npm test
```

### Test Coverage:
- Demo user password hash & authentication verification
- Question bank volume checks ($\ge 25$ reasoning questions for SSC CGL)
- Custom test generation & question count boundary validation
- Authoritative timer deadline calculations
- CBT Question palette status transitions (`NOT_VISITED`, `NOT_ANSWERED`, `ANSWERED`, `MARKED_FOR_REVIEW`, `ANSWERED_AND_MARKED`)
- Deterministic scoring, marks summation, and negative penalty deduction
- Division-by-zero protection in accuracy calculations
- Idempotent test submission
- Scheduled test timetable persistence
- Gemini AI structured JSON output schema validation

---

## 🚢 Deployment to Vercel

ExamPilot is designed for direct deployment to Vercel:

1. Push your code to GitHub / GitLab / Bitbucket.
2. In the Vercel Dashboard, click **New Project** and select the repository.
3. Add Environment Variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Click **Deploy**. Next.js will build all static and dynamic routes.

