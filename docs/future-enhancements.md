# PrepMate — Future Enhancements

A consolidated backlog of planned features and improvements. Items are grouped by category and annotated with effort and impact estimates.

**Effort scale:** Low (< 1 day) · Medium (2–4 days) · High (1–2 weeks)  
**Impact scale:** Low · Medium · High · Critical

---

## Table of Contents

1. [UX & Session Improvements](#1-ux--session-improvements)
2. [AI & Interview Intelligence](#2-ai--interview-intelligence)
3. [Analytics & Progress Tracking](#3-analytics--progress-tracking)
4. [Growth & Retention](#4-growth--retention)
5. [Monetization](#5-monetization)
6. [Technical Infrastructure](#6-technical-infrastructure)

---

## 1. UX & Session Improvements

### 1.1 Save Partial Answers (Auto-Draft)
**Effort:** Low | **Impact:** Medium

Auto-save answer drafts to `localStorage` as the user types so they don't lose work on accidental navigation or page refresh.

**Implementation:**
- Debounce writes to `localStorage` on every keystroke in the answer input
- Key format: `prepmate_draft_<sessionId>_<questionIndex>`
- On session load, restore draft if found and prompt: *"You have an unsaved draft — restore it?"*
- Clear draft on successful submission

---

### 1.2 Share Results (Shareable Summary Card)
**Effort:** Medium | **Impact:** High

Generate a shareable image or link after completing an interview that users can post on LinkedIn / Twitter.

**Implementation:**
- Use `html2canvas` to capture the summary card component as a PNG
- Include: role, difficulty, overall score, top strength, top improvement area, PrepMate branding
- Offer two sharing options:
  - **Download image** — client-side, no backend needed
  - **Shareable link** — store summary JSON in DB, expose `GET /interview/sessions/:id/share` (public, no auth)
- Add Open Graph meta tags for link previews

---

### 1.3 Answer Review Mode
**Effort:** Low | **Impact:** High

Let users revisit any completed session in full — question by question — with their original answers, AI feedback, scores, and an optional "ideal answer" example.

**Implementation:**
- Add a "Review" button on completed sessions in the Dashboard
- New route: `/interview/sessions/:id/review`
- All data is already stored in `InterviewSession.answers` + `evaluations` JSON fields
- On-demand ideal answer: `POST /interview/sessions/:id/ideal-answer?questionIndex=N` → Gemini call
- Show diff-style comparison if user reattempts the same question

---

### 1.4 PDF Report Export
**Effort:** Low | **Impact:** Medium

Download a polished PDF of a completed session to share with mentors or keep for reference.

**Report contents:** Role, difficulty, date, each question + answer + score + feedback, overall score, top improvement areas.

**Implementation:**
- Frontend-only using `jsPDF` + `html2canvas`
- Capture the existing summary page as a PDF — no backend changes needed
- Add "Download PDF" button on the session summary screen

---

## 2. AI & Interview Intelligence

### 2.1 Resume-Based Question Generation
**Effort:** Medium | **Impact:** High

Let users paste or upload their resume. Gemini reads it and generates questions targeting their **specific experience** — making interviews feel personalized rather than generic.

**Implementation:**
- Add a "Resume" step before session creation (optional, skippable)
- Accept paste (textarea) or PDF upload (`pdf-parse` to extract text on the backend)
- Store extracted resume text in session metadata
- Inject resume excerpt into the question generation prompt:  
  *"Given this candidate's background: [resume], generate a [role] interview question at [difficulty] level that probes their specific experience."*
- New optional field: `InterviewSession.resumeContext: string | null`

---

### 2.2 Hint System
**Effort:** Low | **Impact:** High

When a user is stuck, they can request a progressive hint. Gemini nudges them toward the answer without giving it away.

**Implementation:**
- "Get a Hint" button in the chat interface (visible after 30s on a question)
- New endpoint: `POST /interview/sessions/:id/hint`
  - Body: `{ questionIndex, partialAnswer }`
  - Prompt to Gemini: *"The candidate is stuck on this question. Give a guiding hint — a question or a partial clue — without revealing the full answer."*
- Track hint usage per question in `evaluations` JSON; deduct small score penalty (e.g., –5 points) if hint used
- Show hint usage count in the session summary

---

### 2.3 Adaptive Difficulty
**Effort:** Low | **Impact:** Medium

Auto-adjust question difficulty during a session based on the user's running performance, instead of keeping it static.

**Implementation:**
- After each evaluated answer, check rolling average of last 2 scores:
  - ≥ 80% → escalate to next difficulty level
  - ≤ 40% → drop to easier level
- Show a subtle toast notification: *"Great answer! Increasing difficulty."*
- Log the effective difficulty per question in `evaluations` JSON
- Pure logic change in `interview.service.ts` — no schema changes required

---

### 2.4 Topic Tagging & Weakness Analysis
**Effort:** Low | **Impact:** High

When Gemini evaluates an answer, also return a topic tag (e.g., `system-design`, `algorithms`, `behavioral`, `communication`). Surface weakness patterns across sessions.

**Implementation:**
- Add `topic: string` to the evaluation response schema
- Update Gemini evaluation prompt to return a topic tag alongside the score and feedback
- Store tag in `evaluations` JSON array
- Dashboard widget: "Your weakest areas" — bar chart of average score grouped by topic

---

### 2.5 Code Interview Mode (SWE Roles)
**Effort:** High | **Impact:** High

For Software Engineer, Frontend Developer, and Backend Developer roles, add a coding challenge question type with an in-browser code editor.

**Implementation:**
- Embed [Monaco Editor](https://microsoft.github.io/monaco-editor/) or [CodeMirror 6](https://codemirror.net/) in a new `CodeEditor` component
- New question type flag: `{ type: 'coding', language: 'javascript' | 'python' | 'java' }`
- Send the candidate's code + the original problem to Gemini for review:
  - Correctness, time/space complexity, code quality, edge case handling
- No code execution sandbox needed — Gemini reviews statically
- Triggered only for applicable roles (not PM, UX, etc.)

---

### 2.6 Behavioral STAR Mode
**Effort:** Medium | **Impact:** Medium

For PM, UX Designer, and non-technical roles, add a structured STAR (Situation, Task, Action, Result) interview mode.

**Implementation:**
- New session mode option: `mode: 'star' | 'technical'`
- All questions are behavioral: *"Tell me about a time when..."*
- UI shows four labeled sections instead of a single textarea:
  - **Situation** — What was the context?
  - **Task** — What was your responsibility?
  - **Action** — What did you do specifically?
  - **Result** — What was the outcome?
- Gemini evaluates each STAR component with individual sub-scores and combined overall score
- Store structured STAR answer in `answers` JSON

---

## 3. Analytics & Progress Tracking

### 3.1 Analytics Charts Dashboard
**Effort:** Low | **Impact:** High

Visualize the data already being stored in `evaluations` and sessions. No backend changes needed — just a new frontend chart layer.

**Charts to add:**
- **Score trend** — Line chart of average score per session over time
- **Radar / spider chart** — Strengths vs. weaknesses by topic (requires topic tagging from §2.4)
- **Practice heatmap** — GitHub-style calendar showing which days the user practiced
- **Role distribution** — Pie chart of sessions by role

**Library:** [Recharts](https://recharts.org/) — lightweight, React-native, minimal bundle impact.

---

## 4. Growth & Retention

### 4.1 Streak & Gamification
**Effort:** Medium | **Impact:** High

Daily practice streaks, XP points, and badges to increase user retention.

**Implementation:**
- Add to `User` entity: `currentStreak: number`, `longestStreak: number`, `lastPracticeDate: date`, `xpPoints: number`
- Award XP on session completion (base + difficulty multiplier)
- Award badges for milestones: first session, 7-day streak, 10 sessions completed, first perfect score, etc.
- Store earned badges in `User.badges: string[]` JSON column
- Frontend: streak counter and badge shelf on the Dashboard
- Backend: streak calculation in `UsersService.updateStreak()` called after each session ends

---

### 4.2 Custom Question Sets
**Effort:** Medium | **Impact:** Medium

Let users add their own custom questions to their session pool, supplementing or replacing AI-generated ones.

**Implementation:**
- New entity: `CustomQuestion { id, userId, role, difficulty, text, createdAt }`
- CRUD endpoints: `POST/GET/DELETE /interview/custom-questions`
- During session question generation, mix custom questions with AI-generated ones (configurable ratio)
- UI: "My Questions" section under settings or the role selector screen

---

### 4.3 Company-Specific Modes
**Effort:** Medium | **Impact:** High

*"Prepare for Google / Meta / Amazon"* templates with company-specific question styles and focus areas.

**Implementation:**
- Create a `companies` config object (static, no DB needed initially):
  ```ts
  {
    google: { focusAreas: ['system design', 'algorithms', 'leadership'], style: 'open-ended' },
    amazon: { focusAreas: ['leadership principles', 'behavioral', 'system design'], style: 'star' },
    meta: { focusAreas: ['product sense', 'execution', 'leadership'], style: 'mixed' }
  }
  ```
- Inject company context into the Gemini prompt: *"Generate a question in the style of a [company] interview, focusing on [focusAreas]."*
- Add company selector step in the session creation flow
- Store `company: string | null` in `InterviewSession`

---

### 4.4 Peer Comparison (Anonymous Percentile)
**Effort:** High | **Impact:** Medium

Show users how they rank vs. others: *"You scored better than 73% of users for this role."*

**Implementation:**
- Aggregate score statistics per role + difficulty in a materialized view or scheduled job
- Store percentile bands (p25, p50, p75, p90) in a `RoleStats` table, refreshed nightly
- After session completion, query the relevant band and display percentile
- Keep all comparisons fully anonymous — never expose individual user data

---

## 5. Monetization

### 5.1 Payment Integration (Razorpay / Stripe)
**Effort:** Medium | **Impact:** Critical

Full implementation guides already exist in [razorpay.md](razorpay.md) and [stripe.md](stripe.md). This is the primary revenue path.

**Proposed plan tiers:**

| Plan | Price | Sessions/month | Features |
|------|-------|---------------|----------|
| Free | ₹0 | 3 | Basic roles, standard difficulty |
| Pro | ₹299/mo | Unlimited | All roles, adaptive difficulty, analytics, PDF export |
| Team | ₹999/mo | Unlimited (5 seats) | Everything in Pro + team analytics |

**Backend changes needed:**
- Add to `User` entity: `plan: 'free' | 'pro' | 'team'`, `sessionsUsedThisMonth: number`, `planExpiresAt: Date`
- `SessionGuard` — check quota before allowing `POST /interview/sessions`
- Webhook handler to update `plan` on successful payment
- Monthly cron job to reset `sessionsUsedThisMonth`

**Payment provider choice:**
- **Razorpay** — for India (UPI, cards, net banking)
- **Stripe** — for international users
- Implement both; auto-select based on user's country (from IP geolocation or profile)

---

## 6. Technical Infrastructure

### 6.1 Real Redis Instance
**Effort:** Low | **Impact:** Medium

The cache service has a Redis adapter already written but falls back to in-memory on missing config. Set up a persistent Redis instance so cache survives server restarts.

**Options:**
- **Upstash** (recommended) — serverless Redis, free tier, zero ops, works on Railway/Render
- **Railway Redis** — one-click plugin if already on Railway
- **Redis Cloud** — 30 MB free tier

**Steps:**
1. Provision instance on Upstash or Railway
2. Set `REDIS_URL` in server environment variables
3. Verify the existing `CacheModule` picks it up (it should — the adapter is already wired)
4. Test: restart server → confirm cached questions persist

---

### 6.2 Email Template Polish
**Effort:** Low | **Impact:** Low

The Handlebars email templates exist but need visual polish for production-quality emails.

**Templates to update:**
- `welcome.hbs` — onboarding email after registration
- `verify-email.hbs` — email verification (currently bypassed; re-enable for production)
- `reset-password.hbs` — password reset flow

**Improvements:**
- Add PrepMate logo and brand colors (forest green palette)
- Mobile-responsive layout using table-based HTML (works in all email clients)
- Plain-text fallback for every template
- Test with [Mailtrap](https://mailtrap.io/) or [Resend](https://resend.com/) before going live
- Switch `EMAIL_HOST` from Ethereal to a real provider (Resend recommended — generous free tier, great DX)

---

## Priority Matrix

| Feature | Effort | Impact | Suggested Order |
|---|---|---|---|
| Payment Integration (Razorpay/Stripe) | Medium | Critical | 1 |
| Analytics Charts Dashboard | Low | High | 2 |
| Hint System | Low | High | 3 |
| Answer Review Mode | Low | High | 4 |
| Topic Tagging & Weakness Analysis | Low | High | 5 |
| Resume-Based Question Generation | Medium | High | 6 |
| Share Results | Medium | High | 7 |
| Streak & Gamification | Medium | High | 8 |
| Company-Specific Modes | Medium | High | 9 |
| Adaptive Difficulty | Low | Medium | 10 |
| PDF Report Export | Low | Medium | 11 |
| Save Partial Answers | Low | Medium | 12 |
| Custom Question Sets | Medium | Medium | 13 |
| Behavioral STAR Mode | Medium | Medium | 14 |
| Real Redis | Low | Medium | 15 |
| Code Interview Mode | High | High | 16 |
| Email Template Polish | Low | Low | 17 |
| Peer Comparison | High | Medium | 18 |
