export type Difficulty = 'easy' | 'medium' | 'hard';

export interface InterviewerConfig {
  /** System message — who Alex is in this role+difficulty context */
  persona: string;
  /** Instruction for the very first question (no greeting, direct question) */
  firstQuestion: string;
  /** Appended to follow-up messages — transition style + question instruction */
  followUpSuffix: string;
  /** Behavioral question hint injected around Q4-Q5 */
  behavioralHint: string;
}

export interface EvaluatorConfig {
  /** System message for answer evaluation */
  persona: string;
  /** What to weigh when scoring — injected into the evaluation user message */
  scoringNote: string;
}

export interface SummaryConfig {
  /** System message for final interview summary */
  persona: string;
  /** Role+difficulty-specific lens for the summary assessment */
  assessmentFocus: string;
}

export interface InterviewPromptConfig {
  interviewer: InterviewerConfig;
  evaluator: EvaluatorConfig;
  summary: SummaryConfig;
}

export type RolePromptConfig = Record<Difficulty, InterviewPromptConfig>;
