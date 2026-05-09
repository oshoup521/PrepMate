# Interview Realism — TODO

Implementation queue for [enhancement.md](./enhancement.md). Ordered by impact × cost.

Legend: `[ ]` open · `[x]` done · `(S/M/L)` rough size · `→ E#` traces back to enhancement ID.

---

## Phase 1 — structural (highest realism payoff)

### Phase-based arc → E1
- [ ] (S) Add `Phase` type to [prompts/types.ts](../server/src/interview/prompts/types.ts): `'intro' | 'clarify' | 'solve' | 'optimize' | 'stress' | 'behavioral' | 'close'`.
- [ ] (M) Extend `InterviewerConfig` with a `phaseFragments: Record<Phase, string>` per role × difficulty.
- [ ] (M) Track `currentPhase` and `turnsInPhase` on `InterviewSession` entity (new columns).
- [ ] (M) Update `buildQuestionMessages` ([interview.service.ts:307](../server/src/interview/interview.service.ts#L307)) to pick the phase fragment instead of a fresh-topic follow-up.
- [ ] (S) Remove `IMPORTANT: No repeated concepts.` from every role file — replaced by phase logic.
- [ ] (S) Add a phase-transition heuristic: advance after 3 turns OR when `lastScore >= 8` on `solve`.

### Resume / background grounding → E2
- [ ] (S) Add `description` (already exists) and optional `profileSummary` to the system prompt builder.
- [ ] (S) In `buildQuestionMessages`, prepend: `Candidate background: ${description}`.
- [ ] (S) Update `firstQuestion` per role file to reference background when present.

### Intro opener → E3
- [ ] (M) Add a non-scored Q0 turn type: "Tell me about yourself / walk me through your background."
- [ ] (S) Wire credits/scoring to skip Q0 (don't store as a graded question).
- [ ] (S) Feed Q0 answer into Q1 context as `candidateIntro`.

### Hint laddering → E4
- [ ] (S) Add `hintCount` to session state (per-question, resets each new problem).
- [ ] (M) Replace the `lastScore <= 4` branch in [interview.service.ts:343](../server/src/interview/interview.service.ts#L343) with: stay on problem, offer hint, increment counter.
- [ ] (S) After 2 hints, allow phase to advance.

### Context-aware behavioral → E5
- [ ] (S) Replace static `behavioralHint` strings with a meta-instruction: "Craft a behavioral Q that probes a trait revealed in their last 2 answers."
- [ ] (S) Pass the last 2–3 Q&A pairs into the behavioral turn's user message.

### Closing turn → E6
- [ ] (M) Add `'close'` phase: prompt asks the candidate "Do you have any questions for me?"
- [ ] (M) If candidate replies with a question, the interviewer answers in persona; if "no", proceeds to summary.
- [ ] (S) Frontend: render the closing turn distinctly (no scoring UI).

### Distinct interviewer names → E6b
- [ ] (S) Pick a name per `(role, difficulty)` — see the table in [enhancement.md](./enhancement.md#tier-1--structural-changes-how-the-interview-flows).
- [ ] (S) Replace `Alex` in every `interviewer.persona` across all 9 role files + [default.ts](../server/src/interview/prompts/default.ts).
- [ ] (S) Replace `Alex` in every `evaluator.persona` to match (same name, same role × difficulty) — keeps the "same person grading you" feel.
- [ ] (S) Frontend: surface the interviewer's name in the session header so the candidate sees who they're talking to.
- [ ] (S) Smoke test: start one session per role × difficulty, confirm name varies.

---

## Phase 2 — fairness & depth

### Coding at hard tier → E7
- [ ] (S) Rewrite `firstQuestion` for hard [frontend-developer.ts:52](../server/src/interview/prompts/frontend-developer.ts#L52) — add 2–3 concrete coding tasks (Promise.all polyfill, virtualized list, etc.).
- [ ] (S) Same for hard [backend-developer.ts:52](../server/src/interview/prompts/backend-developer.ts#L52) — token-bucket rate limiter, idempotency middleware.
- [ ] (S) Same for hard [devops-engineer.ts:52](../server/src/interview/prompts/devops-engineer.ts#L52) — Helm chart, secret rotation script.
- [ ] (S) Update hard `followUpSuffix` to alternate code & architecture, not just architecture.

### Language selection → E8
- [ ] (S) Add `preferredLanguage` field to `CreateSessionDto`.
- [ ] (S) Frontend: language picker on session start (only for SE / FE / BE / FS / DS / QA).
- [ ] (S) Inject language into coding prompts: "Write the solution in ${language}."

### Code execution sandbox → E9 (stretch)
- [ ] (L) Spike: pick runner — Judge0 (self-host) vs Piston (free public) vs in-process Pyodide.
- [ ] (L) Add `/api/interview/run` endpoint — accepts `{language, code, stdin}`, returns `{stdout, stderr, exit_code, time_ms}`.
- [ ] (M) When evaluator runs on a coding answer, execute first; pass exec result into the evaluator prompt.
- [ ] (M) Frontend: show a "Run" button for coding answers before submitting.

---

## Phase 3 — polish

### Turn-length cap → E10
- [ ] (S) Hard tier `followUpSuffix`: change `Total: 1-3 sentences` → `Total: 2-5 sentences, may stack multiple probes`.

### Topic coverage tracking → E11
- [ ] (M) Add `coveredTopics: string[]` to session state.
- [ ] (S) Have evaluator emit a `topic` tag per answer; persist into the array.
- [ ] (S) Pass `coveredTopics` into the prompt so Alex can avoid duplicates AND deliberately revisit weak ones.

### Rubric anchors → E12
- [ ] (S) Add anchor block to every evaluator system message: "9–10 strong hire · 7–8 hire · 5–6 borderline · 3–4 no hire · 1–2 strong no hire."
- [ ] (S) Spot-check 10 evaluations before/after to confirm score drift narrows.

---

## Validation checklist

Run a manual interview after each phase ships and confirm:

- [ ] Interviewer references resume/background by Q2.
- [ ] One problem spans 3+ turns (clarify → solve → follow-up).
- [ ] A weak answer gets a hint, not a topic switch.
- [ ] Behavioral Q quotes something the candidate just said.
- [ ] Session ends with "any questions for me?"
- [ ] Coding tasks are executed (Phase 2 done) — not just LLM-eyeballed.
- [ ] Interviewer's name varies by role & difficulty — never "Alex" across the board.
