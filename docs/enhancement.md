# Interview Realism Enhancements

Source: deep audit of [server/src/interview/prompts/](../server/src/interview/prompts/) and [server/src/interview/interview.service.ts](../server/src/interview/interview.service.ts).

## Goal

Make a PrepMate session feel like a real on-site / phone-screen — not a quiz with rotating topics.

## Current state — what works

- Persona ladder per role × difficulty is convincing (junior friendly → principal rigorous).
- Mixed coding / conceptual prompting at easy & medium for technical roles.
- `lastScore` adapts follow-up difficulty (≥8 harder, ≤4 easier).
- Behavioral question slot at Q4–Q5.
- Role-specific evaluator scoring notes show real domain literacy (e.g. "penalize SQL written without parameterization", "penalize fitting the scaler on the full dataset").

## Gaps that break realism

| # | Gap | Where it lives | Why it matters |
|---|---|---|---|
| 1 | Each Q is a fresh topic — `IMPORTANT: No repeated concepts.` | every role file's `followUpSuffix` | Real senior interviews drill into ONE problem 20–40 min. Today's flow is a quiz. |
| 2 | No resume / background grounding | `session.description` exists ([interview.service.ts:680](../server/src/interview/interview.service.ts#L680)) but is never threaded into `buildQuestionMessages` | Interviewers reference "you mentioned X" — that's what makes it feel personal. |
| 3 | No "tell me about yourself" opener | `firstQuestion` says "No preamble" | Real interviews open with intro + resume walkthrough, then go technical. |
| 4 | No clarifying-questions phase | All prompts assume immediate answer | Real candidates ask "what are the constraints?" before solving. |
| 5 | No hint laddering | Low score → pivots to a NEW topic ([interview.service.ts:343](../server/src/interview/interview.service.ts#L343)) | Real interviewers nudge: "What's a brute-force first?" |
| 6 | Behavioral Qs are hardcoded templates | `behavioralHint` is the same string for every candidate at that role+difficulty | The biggest "AI tell" — no adaptation to what the candidate just said. |
| 7 | No "any questions for me?" closer | Pipeline ends at summary | Universally part of real interviews. |
| 8 | Hard tier drops coding for FE / BE / DevOps | [backend-developer.ts:52](../server/src/interview/prompts/backend-developer.ts#L52), [frontend-developer.ts:52](../server/src/interview/prompts/frontend-developer.ts#L52), [devops-engineer.ts:52](../server/src/interview/prompts/devops-engineer.ts#L52) | Even principal loops include 30 min live coding. Hard SE gets this right; others should mirror it. |
| 9 | Code is graded statically by LLM | [interview.service.ts:493](../server/src/interview/interview.service.ts#L493) | LLMs confidently mark buggy code as correct. No execution = unreliable scoring. |
| 10 | No language selection for coding tasks | Prompts say "write a function" with no language pick | Real coding rounds open with "what language do you want?" |
| 11 | `Total: 1-3 sentences` cap on hard follow-ups | every role file's `followUpSuffix` | Principal interviewers stack 2–3 challenges in one breath. |
| 12 | "No repeated concepts" + ~5 Q session = thin coverage | structural | A senior candidate never gets evaluated deeply on anything. |
| 13 | Every interviewer is named **Alex** | every persona string in every role file | One person can't credibly interview SE, PM, UX, DevOps and DS. Same name across roles is an obvious AI tell. |

## Proposed enhancements

### Tier 1 — structural (changes how the interview flows)

**E1. Phase-based interview arc.** Replace the "rotate topics" model with a state machine threaded into the prompt:

```
intro → clarify → solve → optimize → stress-test → behavioral → close
```

Each phase is one or more turns. The interviewer stays on the same problem from `clarify` through `stress-test`, then transitions. Add a `phase` field passed into `buildQuestionMessages` and a per-phase prompt fragment per role × difficulty.

**E2. Resume / background grounding.** Thread `session.description` (and optionally a richer `profile` blob: years of experience, last role, notable projects) into the system message. Reference it in `firstQuestion` ("Open by asking them to walk you through their background, then transition to a technical question that connects to something they mentioned").

**E3. Intro opener.** Q0 = non-scored "tell me about yourself / walk me through your background." Doesn't consume credits or count toward score. Output is fed forward into Q1 to anchor relevance.

**E4. Hint laddering on `lastScore ≤ 4`.** Currently pivots to a new related question. Change the prompt branch to: *stay on the same problem, offer a small hint, give them another shot*. Track hint count; only pivot after 2 hints.

**E5. Context-aware behavioral.** Pass the last 2–3 answers into the behavioral turn. Replace static `behavioralHint` strings with: "Based on what they shared about [topic], craft a behavioral question that probes [resilience / collaboration / decision-making]."

**E6. Closing turn.** After the last technical/behavioral Q, add a "do you have any questions for me?" turn. If the candidate asks something, the interviewer answers in persona. Then summary generates.

**E6b. Distinct interviewer per role × difficulty.** Replace the global "Alex" with a small name bank — one credible name per `(role, difficulty)`. Aim for variety in gender, seniority cue, and cultural background. Examples:

| Role | Easy | Medium | Hard |
|---|---|---|---|
| Software Engineer | Sam | Priya | Dr. Chen |
| Frontend Developer | Maya | Jordan | Lukas |
| Backend Developer | Diego | Aisha | Ravi |
| Full Stack Developer | Nina | Marcus | Yuki |
| Data Scientist | Ben | Sofia | Dr. Okafor |
| DevOps Engineer | Tom | Hana | Anders |
| Product Manager | Emma | Raj | Vivian |
| UX Designer | Leo | Mei | Camille |
| QA Engineer | Alex | Farah | Henrik |

Names live in the `interviewer.persona` string; nothing else needs to change. Easy tier can stay on first-name basis; hard tier may add a title/last-name cue ("Dr. Chen", "Vivian, VP of Product") to convey seniority.

### Tier 2 — fairness & depth

**E7. Restore coding tasks at hard for FE / BE / DevOps.** Mirror hard SE's mix. Examples:
- Hard FE: "implement a `Promise.all` polyfill", "build a virtualized list from scratch"
- Hard BE: "implement a token-bucket rate limiter class", "write an idempotency-key middleware"
- Hard DevOps: "write a Helm chart for a stateful service with PV claims", "write a Bash script to safely rotate a secret across 50 pods"

**E8. Language selection for coding rounds.** At session start (or first coding turn), prompt the candidate to pick a language. Inject the choice into all subsequent coding prompts.

**E9. Code execution sandbox (stretch).** Run candidate code via Judge0 / Piston / Pyodide before evaluation. Feed `{exit_code, stdout, stderr, test_pass_count}` to the evaluator prompt. Replaces "AI thinks the code looks right" with actual execution.

### Tier 3 — polish

**E10. Loosen turn-length cap on hard tier.** Change `Total: 1-3 sentences` → `Total: 2-5 sentences, may stack multiple probes` for hard difficulty.

**E11. Topic coverage tracking.** Maintain a per-session set of covered sub-topics; pass it into the prompt so Alex avoids accidental repetition AND can deliberately revisit a weak area before closing.

**E12. Score rubric anchors.** Add explicit anchors to the evaluator prompt: 9–10 strong hire, 7–8 hire, 5–6 borderline, 3–4 no hire, 1–2 strong no hire. Reduces score drift across calls.

## Non-goals (deliberately out of scope)

- Video / audio interview simulation.
- Whiteboard / system-design canvas UI.
- Multi-interviewer panel.
- Real-time time pressure (countdown timers).

## Acceptance signals

A session feels real when:
1. The interviewer references the candidate's background by Q2.
2. A single problem spans 3+ turns (clarify → solve → follow-up).
3. A wrong/weak answer gets a hint, not a topic switch.
4. The behavioral question quotes something the candidate just said.
5. The session ends with the candidate getting to ask a question.
6. Coding tasks are actually run, not eyeballed.
7. The interviewer's name fits the role and seniority — never "Alex" across the board.
