import { InterviewPromptConfig, Difficulty, RolePromptConfig } from './types';
import { softwareEngineerPrompts } from './software-engineer';
import { frontendDeveloperPrompts } from './frontend-developer';
import { backendDeveloperPrompts } from './backend-developer';
import { fullStackDeveloperPrompts } from './full-stack-developer';
import { dataScientistPrompts } from './data-scientist';
import { devOpsEngineerPrompts } from './devops-engineer';
import { productManagerPrompts } from './product-manager';
import { uxDesignerPrompts } from './ux-designer';
import { qaEngineerPrompts } from './qa-engineer';
import { defaultPrompts } from './default';

const PROMPT_REGISTRY: Record<string, RolePromptConfig> = {
  'Software Engineer': softwareEngineerPrompts,
  'Frontend Developer': frontendDeveloperPrompts,
  'Backend Developer': backendDeveloperPrompts,
  'Full Stack Developer': fullStackDeveloperPrompts,
  'Data Scientist': dataScientistPrompts,
  'DevOps Engineer': devOpsEngineerPrompts,
  'Product Manager': productManagerPrompts,
  'UX Designer': uxDesignerPrompts,
  'QA Engineer': qaEngineerPrompts,
};

/**
 * Returns the prompt configuration for a given role and difficulty.
 * Falls back to defaultPrompts if the role is not in the registry.
 * Falls back to 'medium' difficulty if the requested difficulty is missing.
 */
export function getPromptConfig(role: string, difficulty: string): InterviewPromptConfig {
  const roleConfig: RolePromptConfig = PROMPT_REGISTRY[role] ?? defaultPrompts;
  const level = (difficulty as Difficulty) in roleConfig ? (difficulty as Difficulty) : 'medium';
  return roleConfig[level];
}

export * from './types';
