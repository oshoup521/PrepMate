import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewSession } from './entities/interview-session.entity';
import { CacheService } from '../cache/cache.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(InterviewSession)
    private interviewSessionRepository: Repository<InterviewSession>,
    private cacheService: CacheService,
    private usersService: UsersService,
  ) {    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required but not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    const modelName = this.configService.get<string>('GEMINI_MODEL');
    if (!modelName) {
      throw new Error('GEMINI_MODEL is required but not set in environment variables');
    }
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  private readonly VALID_ROLES = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'DevOps Engineer',
    'Product Manager',
    'UX Designer',
    'QA Engineer',
  ];

  private readonly ROLE_ALIAS_MAP: Record<string, string> = {
    'software-engineer': 'Software Engineer',
    'frontend-developer': 'Frontend Developer',
    'backend-developer': 'Backend Developer',
    'full-stack-developer': 'Full Stack Developer',
    'fullstack-developer': 'Full Stack Developer',
    'data-scientist': 'Data Scientist',
    'devops-engineer': 'DevOps Engineer',
    'product-manager': 'Product Manager',
    'ux-designer': 'UX Designer',
    'qa-engineer': 'QA Engineer',
  };

  private readonly FALLBACK_QUESTIONS: Record<string, Record<string, string[]>> = {
    'Software Engineer': {
      easy: [
        "What is the difference between a stack and a queue? Can you give a real-world example of each?",
        "Can you explain what version control is and why it matters to a development team?",
        "What does DRY stand for, and why is it an important principle in software development?",
        "What is the difference between a compiled language and an interpreted language?",
      ],
      medium: [
        "Walk me through how you would debug a performance issue that only appears in production.",
        "How do you ensure code quality and maintainability when working on a team project?",
        "Can you describe the SOLID principles and give an example of how you've applied one?",
        "Tell me about a challenging technical problem you solved recently. What was your approach?",
      ],
      hard: [
        "How would you design a distributed rate-limiting system that works across multiple server instances?",
        "Describe your approach to designing a system that needs to handle 1 million concurrent users.",
        "How would you migrate a monolithic application to microservices with zero downtime?",
        "Explain the trade-offs between consistency and availability in distributed systems.",
      ],
    },
    'Frontend Developer': {
      easy: [
        "What is the difference between HTML, CSS, and JavaScript? How do they work together?",
        "Can you explain what responsive design is and how you implement it?",
        "What is the difference between `let`, `const`, and `var` in JavaScript?",
        "What is the DOM and how does JavaScript interact with it?",
      ],
      medium: [
        "How do you optimize a React application for performance? Give specific examples.",
        "Can you explain the concept of state management and when you would use a library like Redux?",
        "How do you approach cross-browser compatibility in your frontend projects?",
        "Tell me about a challenging UI component you built. What made it difficult and how did you solve it?",
      ],
      hard: [
        "How would you architect a large-scale React application with multiple teams working on it?",
        "Describe your approach to implementing micro-frontends. What are the trade-offs?",
        "How would you design a real-time collaborative UI that stays in sync across multiple users?",
        "Explain how you would build a design system from scratch and ensure adoption across teams.",
      ],
    },
    'Backend Developer': {
      easy: [
        "Can you explain the difference between REST and GraphQL APIs?",
        "What is a database index and why is it important for performance?",
        "What is the difference between authentication and authorization?",
        "Can you explain what an ORM is and when you would use one?",
      ],
      medium: [
        "How would you design an API that needs to handle file uploads and processing?",
        "Describe how you would implement rate limiting in a backend service.",
        "How do you approach database schema design for a new feature?",
        "Tell me about a time you had to optimize a slow database query. What was your process?",
      ],
      hard: [
        "How would you design a backend system that processes millions of events per day reliably?",
        "Explain how you would implement a distributed transaction across multiple microservices.",
        "How would you design a caching strategy for a system with complex data relationships?",
        "Describe your approach to ensuring data consistency in an eventual consistency model.",
      ],
    },
    'Full Stack Developer': {
      easy: [
        "How does a web request travel from the browser to a server and back?",
        "Can you explain the difference between client-side and server-side rendering?",
        "What is CORS and why does it exist?",
        "Describe the differences between cookies, localStorage, and sessionStorage.",
      ],
      medium: [
        "How do you decide what logic to put on the frontend versus the backend?",
        "Tell me about a full-stack feature you built end-to-end. What were the key decisions?",
        "How do you handle authentication in a full-stack application?",
        "What is your approach to API design when you control both the frontend and backend?",
      ],
      hard: [
        "How would you design a real-time notification system for a social media platform?",
        "Describe how you would architect a full-stack application for global scale.",
        "How would you approach building a collaborative feature like Google Docs from scratch?",
        "Explain how you would handle state synchronization between the client and server.",
      ],
    },
    'Data Scientist': {
      easy: [
        "What is the difference between supervised and unsupervised learning?",
        "Can you explain what overfitting is and how you can prevent it?",
        "What is the purpose of cross-validation in machine learning?",
        "What is the difference between precision and recall? When would you optimize for each?",
      ],
      medium: [
        "How do you handle missing data in a dataset? What are the trade-offs of different approaches?",
        "Can you walk me through your approach to a binary classification problem from start to finish?",
        "How do you communicate complex model results to non-technical stakeholders?",
        "Tell me about a data project where the results surprised you. What did you learn?",
      ],
      hard: [
        "How would you design an A/B testing framework for a large-scale production system?",
        "Describe your approach to building a recommendation system at scale.",
        "How would you detect and handle data drift in a production ML model?",
        "Explain how you would approach building a real-time anomaly detection system.",
      ],
    },
    'DevOps Engineer': {
      easy: [
        "What is the difference between continuous integration and continuous deployment?",
        "Can you explain what containerization is and why Docker is popular?",
        "What is infrastructure as code and what are its benefits?",
        "What is the purpose of a load balancer?",
      ],
      medium: [
        "How would you design a CI/CD pipeline for a microservices application?",
        "Describe your approach to monitoring and alerting for a production system.",
        "How do you handle secrets management in a cloud environment?",
        "Tell me about a production incident you responded to. How did you handle it?",
      ],
      hard: [
        "How would you design a zero-downtime deployment strategy for a critical production service?",
        "Describe how you would implement disaster recovery for a multi-region application.",
        "How would you approach reducing cloud infrastructure costs without impacting reliability?",
        "Explain how you would design a Kubernetes cluster for a high-availability application.",
      ],
    },
    'Product Manager': {
      easy: [
        "How do you define and measure the success of a product feature?",
        "Can you explain what a user story is and how you write a good one?",
        "What is the difference between an MVP and a finished product?",
        "How do you prioritize features when everything seems equally important?",
      ],
      medium: [
        "Walk me through how you would handle a situation where engineering says a feature is too complex to build on time.",
        "How do you gather and incorporate user feedback into your product decisions?",
        "Tell me about a product decision you made that did not go as expected. What did you learn?",
        "How do you align stakeholders with different goals and priorities?",
      ],
      hard: [
        "How would you build and execute a go-to-market strategy for a new product in a competitive space?",
        "Describe how you would approach building a product roadmap when you have limited data.",
        "How do you balance short-term business goals with long-term product vision?",
        "Tell me about a time you had to pivot a product strategy. How did you make the decision?",
      ],
    },
    'UX Designer': {
      easy: [
        "What is the difference between UX design and UI design?",
        "Can you explain what a user persona is and how it helps in the design process?",
        "What are some common usability heuristics you consider in your designs?",
        "How do you approach designing for accessibility?",
      ],
      medium: [
        "Walk me through your design process from research to final handoff.",
        "How do you conduct user research and how does it influence your design decisions?",
        "Tell me about a design you are particularly proud of. What made it successful?",
        "How do you handle conflicting feedback from stakeholders versus users?",
      ],
      hard: [
        "How would you design a complex enterprise product for users with varying levels of technical expertise?",
        "Describe how you would rebuild the UX of an existing product with poor usability without alienating current users.",
        "How do you measure the impact of UX improvements on business metrics?",
        "Tell me about a time you advocated for a user-centered approach against business pressure. What was the outcome?",
      ],
    },
    'QA Engineer': {
      easy: [
        "What is the difference between black-box and white-box testing?",
        "Can you explain the difference between a bug and a feature request?",
        "What is regression testing and why is it important?",
        "What makes a good test case? Can you walk me through writing one?",
      ],
      medium: [
        "How do you decide what to automate versus what to test manually?",
        "Describe your approach to testing a new feature from start to finish.",
        "How do you handle a situation where you find a critical bug right before a release?",
        "Tell me about a time your testing caught a significant issue. What was your process?",
      ],
      hard: [
        "How would you design a test strategy for a microservices system with many service dependencies?",
        "Describe how you would build an end-to-end test suite that is reliable and maintainable at scale.",
        "How would you approach performance testing a system expected to handle 100,000 concurrent users?",
        "Explain how you would shift quality left in a development organization.",
      ],
    },
  };

  private normalizeRole(role: string): string {
    if (!role) return role;
    const trimmed = role.trim();
    return this.ROLE_ALIAS_MAP[trimmed.toLowerCase()] ?? trimmed;
  }

  private validateRole(role: string): void {
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('Role is required and must be a non-empty string');
    }
    if (!this.VALID_ROLES.includes(role)) {
      throw new Error(`Role must be one of: ${this.VALID_ROLES.join(', ')}`);
    }
  }

  private validateDifficulty(difficulty: string): void {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('User ID is required and must be a non-empty string');
    }
  }

  private getFallbackQuestion(role: string, difficulty: string, context?: string): { question: string; context: string } {
    const difficultyKey = difficulty === 'easy' ? 'easy' : difficulty === 'hard' ? 'hard' : 'medium';
    const roleQuestions = this.FALLBACK_QUESTIONS[role] ?? this.FALLBACK_QUESTIONS['Software Engineer'];
    const questions = roleQuestions[difficultyKey] ?? roleQuestions['medium'];

    // Use context length as a lightweight seed to vary questions across calls
    const idx = context ? (context.length % questions.length) : Math.floor(Math.random() * questions.length);
    return {
      question: questions[idx],
      context: 'Ideal answers should demonstrate clear thinking, relevant experience, and concrete examples.',
    };
  }

  private getFallbackEvaluation(answer: string): { score: number; feedback: string; improvement_areas: string; isFallback: boolean } {
    const len = answer.trim().length;
    let score: number;
    let feedback: string;
    let improvement_areas: string;

    if (len < 50) {
      score = 4;
      feedback = "Thanks for your response. I'd love to hear more detail — expanding on your reasoning helps me understand your thinking process.";
      improvement_areas = "Try to provide more depth. Walk through your thought process step by step and include concrete examples or experiences.";
    } else if (len < 200) {
      score = 5;
      feedback = "Good start! You touched on some key points. Adding specific examples from your experience would strengthen this answer considerably.";
      improvement_areas = "Build on this foundation by including real-world examples and exploring the 'why' behind your decisions.";
    } else if (len < 500) {
      score = 6;
      feedback = "Nice work covering the main points. Your answer shows a solid understanding of the topic. More specific technical details would take this to the next level.";
      improvement_areas = "Consider adding concrete examples from past experience and exploring edge cases or trade-offs in your answers.";
    } else {
      score = 7;
      feedback = "Well done — you gave a thorough and detailed response that covers the topic well. It's clear you've thought about this.";
      improvement_areas = "Keep refining your answers to be concise while maintaining depth — interviewers appreciate both thoroughness and clarity.";
    }

    return { score, feedback, improvement_areas, isFallback: true };
  }

  private async callAIWithTimeout<T>(
    prompt: string,
    timeoutMs: number = 30000,
    maxRetries: number = 3
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI call timeout')), timeoutMs);
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const aiPromise = this.model.generateContent(prompt);
        const result = await Promise.race([aiPromise, timeoutPromise]);
        const response = await result.response;
        return response.text();
      } catch (error) {
        this.logger.error(`AI call attempt ${attempt} failed:`, error);
        
        // Check if it's a 503 Service Unavailable error (overloaded)
        const is503Error = error.message && (
          error.message.includes('503') || 
          error.message.includes('Service Unavailable') ||
          error.message.includes('overloaded')
        );
        
        // If it's the last attempt or not a retryable error, throw
        if (attempt === maxRetries || !is503Error) {
          throw error;
        }
        
        // Wait with exponential backoff before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        this.logger.warn(`Service overloaded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw new Error('All retry attempts failed');
  }async generateQuestion(role: string, difficulty: string = 'medium', context?: string): Promise<any> {
    try {
      // Normalize and validate inputs
      role = this.normalizeRole(role);
      this.validateRole(role);
      this.validateDifficulty(difficulty);

      // Create a more specific cache key that includes context hash to avoid repeated questions
      const contextHash = context ? Buffer.from(context).toString('base64').slice(0, 20) : 'default';
      const cacheKey = `question:${role}:${difficulty}:${contextHash}`;
      
      // Skip caching if context contains previous questions to ensure uniqueness
      const shouldCache = !context || !context.includes('Previous questions');
      
      if (shouldCache) {
        const cachedQuestion = await this.cacheService.get<any>(cacheKey);
        
        if (cachedQuestion && typeof cachedQuestion === 'object' && cachedQuestion.question) {
          this.logger.debug(`Cache hit for question generation: ${cacheKey}`);
          return {
            ...cachedQuestion,
            fromCache: true,
            timestamp: new Date().toISOString()
          };
        }
      }

      this.logger.debug(`Generating new question for role: ${role}, difficulty: ${difficulty}`);

      const difficultyMap = {
        easy: 'beginner-level',
        medium: 'intermediate-level', 
        hard: 'advanced-level'
      };
      
      const actualDifficulty = difficultyMap[difficulty] || 'intermediate-level';
      const contextPrompt = context ? `Context: ${context}\n` : '';
      
      const isFirstQ = !context || !context.includes('Previous questions');
      const prompt = isFirstQ
        ? `You are Alex, a warm and professional ${role} interviewer. Start with a brief friendly greeting, then ask a ${actualDifficulty}-level interview question. Keep it under 4 sentences, plain text only. Format the response as JSON with 'question' and 'context' fields. The 'context' should include the ideal answer points.`
        : `You are Alex, a warm and professional ${role} interviewer. ${contextPrompt}IMPORTANT: Avoid asking similar or duplicate questions. Start with a brief natural transition phrase then ask a new ${actualDifficulty}-level question. Plain text only. Format the response as JSON with 'question' and 'context' fields. The 'context' should include the ideal answer points.`;

      const text = await this.callAIWithTimeout<string>(prompt);

      let questionData;

      try {
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(text);
        questionData = {
          ...parsedResponse,
          role,
          difficulty,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        // If parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            questionData = {
              ...parsed,
              role,
              difficulty,
              timestamp: new Date().toISOString()
            };
          } catch (e2) {
            // If that fails too, return the raw text with a default structure
            questionData = {
              question: text.trim(),
              context: 'No structured context available',
              role,
              difficulty,
              timestamp: new Date().toISOString()
            };
          }
        } else {
          // If no JSON pattern found, return the raw text
          questionData = {
            question: text.trim(),
            context: 'No structured context available',
            role,
            difficulty,
            timestamp: new Date().toISOString()
          };
        }
      }

      // Cache the generated question for 30 minutes (only if we should cache)
      if (shouldCache) {
        await this.cacheService.set(cacheKey, questionData, 1800000);
      }
      
      return questionData;
      
    } catch (error) {
      this.logger.error('Error generating question:', error);
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  }  async evaluateAnswer(question: string, answer: string, role: string): Promise<any> {
    try {
      // Normalize and validate inputs
      role = this.normalizeRole(role);
      this.validateRole(role);
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        throw new Error('Question is required and must be a non-empty string');
      }
      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        throw new Error('Answer is required and must be a non-empty string');
      }
      if (answer.length > 5000) {
        throw new Error('Answer must be less than 5000 characters');
      }

      // Try to get from cache first
      const cacheKey = `evaluation:${Buffer.from(question + answer + role).toString('base64').slice(0, 50)}`;
      const cachedEvaluation = await this.cacheService.get<any>(cacheKey);
      
      if (cachedEvaluation && typeof cachedEvaluation === 'object' && cachedEvaluation.score !== undefined) {
        this.logger.debug(`Cache hit for answer evaluation: ${cacheKey}`);
        return {
          ...cachedEvaluation,
          fromCache: true,
          timestamp: new Date().toISOString()
        };
      }

      this.logger.debug(`Evaluating answer for role: ${role}`);

      const prompt = `You are Alex, a warm and empathetic ${role} interviewer evaluating a candidate's response.
                     Question: "${question}"
                     Candidate's answer: "${answer}"

                     Respond conversationally as Alex — acknowledge what they did well, gently note gaps, stay encouraging. Sound like a real person, not a report card.
                     Format the response as JSON with 'score' (integer 1-10), 'feedback' (2-4 conversational sentences), and 'improvement_areas' (1-2 sentences of friendly advice) fields.`;

      const text = await this.callAIWithTimeout<string>(prompt);

      let evaluationData;

      try {
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(text);
        evaluationData = {
          ...parsedResponse,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        // If parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            evaluationData = {
              ...parsed,
              timestamp: new Date().toISOString()
            };
          } catch (e2) {
            // If that fails too, return the raw text with a default structure
            evaluationData = {
              score: 'N/A',
              feedback: text,
              improvement_areas: 'No structured improvement areas available',
              timestamp: new Date().toISOString()
            };
          }
        } else {
          // If no JSON pattern found, return the raw text
          evaluationData = {
            score: 'N/A',
            feedback: text,
            improvement_areas: 'No structured improvement areas available',
            timestamp: new Date().toISOString()
          };
        }
      }

      // Cache the evaluation for 1 hour
      await this.cacheService.set(cacheKey, evaluationData, 3600000);
        return evaluationData;
      
    } catch (error) {
      this.logger.error('Error evaluating answer:', error);
      throw new Error(`Failed to evaluate answer: ${error.message}`);
    }
  }

  async *generateQuestionStream(
    role: string,
    difficulty: string = 'medium',
    context?: string,
  ): AsyncGenerator<{ type: string; content?: string; data?: any }> {
    role = this.normalizeRole(role);
    this.validateRole(role);
    this.validateDifficulty(difficulty);

    const difficultyMap = {
      easy: 'beginner-level',
      medium: 'intermediate-level',
      hard: 'advanced-level',
    };
    const actualDifficulty = difficultyMap[difficulty] || 'intermediate-level';
    const contextPrompt = context ? `Context: ${context}\n` : '';
    const uniquenessHint =
      context && context.includes('Previous questions')
        ? 'IMPORTANT: Avoid similar or duplicate questions. Create a unique question exploring different aspects of the role.\n'
        : '';

    const isFirstQuestion = !context || !context.includes('Previous questions');

    const prompt = isFirstQuestion
      ? `You are Alex, a warm and professional ${role} interviewer. You are encouraging, empathetic, and conversational — not robotic. You make candidates feel comfortable while still being thorough.

Start with a brief, friendly one-sentence greeting, then naturally flow into your first ${actualDifficulty}-level interview question. Keep the total response under 4 sentences. Write plain text only — no JSON, no markdown, no bullet points.

After the question, on a new line write exactly "---" and then write the ideal answer key points (for internal scoring use only).`
      : `You are Alex, a warm and professional ${role} interviewer continuing a live interview session.

${contextPrompt}${uniquenessHint}Ask a new ${actualDifficulty}-level question. Start with a very brief natural transition phrase (e.g. "Good.", "Interesting.", "Let's shift gears." — keep it to 2-5 words), then ask your question. Total response should be 1-3 sentences. Write plain text only — no JSON, no markdown, no bullet points.

After the question, on a new line write exactly "---" and then write the ideal answer key points (for internal scoring use only).`;

    try {
      const result = await this.model.generateContentStream(prompt);
      let accumulated = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (!text) continue;
        accumulated += text;
        yield { type: 'token', content: text };
      }

      const sepMatch = accumulated.match(/\n---\s*\n/);
      const question = sepMatch
        ? accumulated.slice(0, sepMatch.index).trim()
        : accumulated.trim();
      const questionContext = sepMatch
        ? accumulated.slice((sepMatch.index ?? 0) + sepMatch[0].length).trim()
        : 'No structured context available';

      yield {
        type: 'done',
        data: { question, context: questionContext, role, difficulty, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      this.logger.warn(`AI question stream failed, using fallback question: ${error.message}`);
      const fallback = this.getFallbackQuestion(role, difficulty, context);
      yield {
        type: 'done',
        data: { ...fallback, role, difficulty, timestamp: new Date().toISOString(), isFallback: true },
      };
    }
  }

  async *evaluateAnswerStream(
    question: string,
    answer: string,
    role: string,
  ): AsyncGenerator<{ type: string; content?: string; data?: any }> {
    role = this.normalizeRole(role);
    this.validateRole(role);
    if (!question?.trim()) throw new Error('Question is required');
    if (!answer?.trim()) throw new Error('Answer is required');
    if (answer.length > 5000) throw new Error('Answer must be less than 5000 characters');

    const prompt = `You are Alex, a warm and empathetic ${role} interviewer evaluating a candidate's response in a live interview.

Question asked: "${question}"
Candidate's response: "${answer}"

Respond as Alex would in a real human interview — naturally and conversationally. Acknowledge what they did well (even briefly), gently note what was missing if anything, and stay encouraging. Sound like a real person giving feedback, not a report card. Keep it to 2-4 sentences.

Use this EXACT output format — do not deviate:
Line 1: SCORE: [a single integer from 1 to 10]
Lines 2 onwards: [2-4 sentences of warm, conversational feedback as Alex]
Then a line with exactly "---"
Then: [1-2 sentences of friendly advice on what to study or improve, phrased as genuine guidance]`;

    try {
      const result = await this.model.generateContentStream(prompt);
      let accumulated = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (!text) continue;
        accumulated += text;
        yield { type: 'token', content: text };
      }

      const firstNewline = accumulated.indexOf('\n');
      const scoreLine = firstNewline !== -1 ? accumulated.slice(0, firstNewline).trim() : accumulated.trim();
      const scoreMatch = scoreLine.match(/^SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

      const sepMatch = accumulated.match(/\n---\s*\n/);
      const afterScore = firstNewline !== -1 ? firstNewline + 1 : 0;
      let feedback: string;
      let improvement_areas: string;

      if (sepMatch) {
        feedback = accumulated.slice(afterScore, sepMatch.index).trim();
        improvement_areas = accumulated.slice((sepMatch.index ?? 0) + sepMatch[0].length).trim();
      } else {
        feedback = accumulated.slice(afterScore).trim();
        improvement_areas = 'No structured improvement areas available';
      }

      yield {
        type: 'done',
        data: {
          score: score ?? 'N/A',
          feedback: feedback || accumulated.trim(),
          improvement_areas,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.warn(`AI evaluation stream failed, using fallback evaluation: ${error.message}`);
      const fallback = this.getFallbackEvaluation(answer);
      yield {
        type: 'done',
        data: { ...fallback, timestamp: new Date().toISOString() },
      };
    }
  }

  async createSession(
    userId: string, 
    jobRole: string, 
    difficulty: string = 'medium',
    description?: string
  ): Promise<InterviewSession> {
    try {
      // Normalize and validate inputs
      jobRole = this.normalizeRole(jobRole);
      this.validateUserId(userId);
      this.validateRole(jobRole);
      this.validateDifficulty(difficulty);
      
      if (description && description.length > 500) {
        throw new Error('Description must be less than 500 characters');
      }

      // Credit gating: check credits before allowing session start (deduction happens at session end)
      const user = await this.usersService.findById(userId);
      if (!user || user.sessionCredits <= 0) {
        throw new ForbiddenException('No session credits remaining. Purchase a pack to continue.');
      }

      this.logger.debug(`Creating session for user: ${userId}, role: ${jobRole}, difficulty: ${difficulty}`);      const session = this.interviewSessionRepository.create({
        userId,
        role: jobRole,
        difficulty,
        description,
        questions: [],
        answers: [],
        evaluations: [],
        completed: false,
        status: 'active', // Set initial status
      });
      
      const savedSession = await this.interviewSessionRepository.save(session);
      
      // Cache the session for quick access
      await this.cacheService.cacheUserSession(userId, savedSession);
      
      // Clear user progress cache to reflect new session
      await this.cacheService.del(`user_progress:${userId}`);
      await this.cacheService.del(`user_sessions:${userId}`);
      
      return savedSession;
    } catch (error) {
      this.logger.error('Error creating session:', error);
      // Re-throw NestJS HTTP exceptions (e.g. ForbiddenException) directly
      if (error?.status && error?.response) {
        throw error;
      }
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }
  async updateSession(sessionId: string, questions: any[], answers: any[], summary?: any): Promise<InterviewSession> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      if (!Array.isArray(questions)) {
        throw new Error('Questions must be an array');
      }
      if (!Array.isArray(answers)) {
        throw new Error('Answers must be an array');
      }

      this.logger.debug(`Updating session: ${sessionId}`);

      const session = await this.interviewSessionRepository.findOne({ where: { id: sessionId } });
      
      if (!session) {
        throw new Error('Session not found');
      }
        session.questions = questions;
      session.answers = answers;
      
      // Update status based on activity
      if (questions.length > 0) {
        session.status = 'in_progress';
      }
      
      if (summary) {
        session.summary = summary;
        session.completed = true;
        session.status = 'completed';
      }
      
      const updatedSession = await this.interviewSessionRepository.save(session);
      
      // Update cache
      await this.cacheService.cacheUserSession(session.userId, updatedSession);
      
      return updatedSession;
    } catch (error) {
      this.logger.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }
  async updateSessionData(
    sessionId: string, 
    userId: string, 
    updateData: any
  ): Promise<InterviewSession> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      this.validateUserId(userId);
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data is required and must be an object');
      }

      this.logger.debug(`Updating session data for session: ${sessionId}, user: ${userId}`);

      const session = await this.interviewSessionRepository.findOne({ 
        where: { id: sessionId, userId } 
      });
      
      if (!session) {
        throw new Error('Session not found or access denied');
      }
      
      Object.assign(session, updateData);
      
      // Auto-update status based on data
      if (updateData.questions && updateData.questions.length > 0 && session.status === 'active') {
        session.status = 'in_progress';
      }
      if (updateData.completed === true) {
        session.status = 'completed';
      }
      
      const updatedSession = await this.interviewSessionRepository.save(session);
      
      // Update cache
      await this.cacheService.cacheUserSession(userId, updatedSession);
      
      // Clear user progress cache to reflect session updates
      await this.cacheService.del(`user_progress:${userId}`);
      await this.cacheService.del(`user_sessions:${userId}`);
      
      return updatedSession;
    } catch (error) {
      this.logger.error('Error updating session data:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    try {
      this.validateUserId(userId);

      this.logger.debug(`Getting sessions for user: ${userId}`);

      // Try to get from cache first
      const cachedSessions = await this.cacheService.get<InterviewSession[]>(`user_sessions:${userId}`);
      
      if (cachedSessions && Array.isArray(cachedSessions)) {
        this.logger.debug(`Cache hit for user sessions: ${userId}`);
        return cachedSessions;
      }

      const sessions = await this.interviewSessionRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      
      // Cache sessions for 15 minutes
      await this.cacheService.set(`user_sessions:${userId}`, sessions, 900000);
      
      return sessions;
    } catch (error) {
      this.logger.error('Error retrieving user sessions:', error);
      throw new Error(`Failed to retrieve sessions: ${error.message}`);
    }
  }  async getSession(sessionId: string, userId: string): Promise<InterviewSession> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      this.validateUserId(userId);

      this.logger.debug(`Getting session: ${sessionId} for user: ${userId}`);

      // Try to get from cache first
      const cacheKey = `session:${sessionId}:${userId}`;
      const cachedSession = await this.cacheService.get<InterviewSession>(cacheKey);
      
      if (cachedSession && typeof cachedSession === 'object' && cachedSession.id) {
        this.logger.debug(`Cache hit for session: ${cacheKey}`);
        return cachedSession;
      }

      const session = await this.interviewSessionRepository.findOne({
        where: { id: sessionId, userId },
      });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Cache session for 30 minutes
      await this.cacheService.set(cacheKey, session, 1800000);
      
      return session;
    } catch (error) {
      this.logger.error('Error retrieving session:', error);
      throw new Error(`Failed to retrieve session: ${error.message}`);
    }
  }
  async generateInterviewSummary(sessionId: string, userId: string): Promise<any> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      this.validateUserId(userId);

      this.logger.debug(`Generating summary for session: ${sessionId}, user: ${userId}`);

      const session = await this.getSession(sessionId, userId);
      
      if (!session.questions || !session.answers || session.questions.length === 0) {
        throw new Error('No interview data found for summary generation');
      }

      // Try to get from cache first
      const cacheKey = `summary:${sessionId}`;
      const cachedSummary = await this.cacheService.get<any>(cacheKey);
      
      if (cachedSummary && typeof cachedSummary === 'object' && cachedSummary.overallScore !== undefined) {
        this.logger.debug(`Cache hit for summary: ${cacheKey}`);
        return {
          ...cachedSummary,
          fromCache: true
        };
      }

      const interviewData = session.questions.map((q, index) => ({
        question: q,
        answer: session.answers[index] || 'No answer provided',
        evaluation: session.evaluations && session.evaluations[index] ? session.evaluations[index] : null
      }));

      const prompt = `Analyze this ${session.role} interview session and provide a comprehensive summary.
                     
                     Interview Data:
                     ${JSON.stringify(interviewData, null, 2)}
                     
                     Role: ${session.role}
                     Difficulty: ${session.difficulty}
                     
                     Please provide:
                     1. Overall performance score (1-10)
                     2. Key strengths demonstrated (as array of strings)
                     3. Areas for improvement (as array of strings)
                     4. Specific recommendations for skill development (as detailed text)
                     5. Technical competency assessment (as detailed text)
                     
                     IMPORTANT: Format all text content using proper markdown:
                     - Use **bold** for important concepts, technologies, and key terms
                     - Use *italic* for emphasis
                     - Use \`code\` for technical terms, function names, and code snippets
                     - Use ### for section headers within recommendations
                     - Use - for bullet points in lists
                     - Use > for important quotes or tips
                     
                     Format the response as JSON with fields: 'overallScore', 'strengths', 'improvements', 'recommendations', 'technicalAssessment'.
                     
                     Example format for recommendations:
                     "### Next Steps - **Fundamentals of Data Preprocessing:** Focus on mastering the fundamentals of data preprocessing, including techniques for handling missing data (mean/median/mode imputation, KNN imputation, regression imputation, deletion), handling skewed data (log transformation, winsorization, Box-Cox transformation), and feature scaling/normalization. - **Practice Problem Solving:** Work through practice problems and case studies that involve data preprocessing. This will help to solidify understanding and develop the ability to apply these techniques in different contexts."`;

      const text = await this.callAIWithTimeout<string>(prompt, 45000); // Longer timeout for summary generation

      let aiSummaryData;

      try {
        const parsedResponse = JSON.parse(text);
        aiSummaryData = {
          ...parsedResponse,
          sessionId,
          generatedAt: new Date().toISOString(),
          questionCount: session.questions.length,
          role: session.role,
          difficulty: session.difficulty
        };
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            aiSummaryData = {
              ...parsed,
              sessionId,
              generatedAt: new Date().toISOString(),
              questionCount: session.questions.length,
              role: session.role,
              difficulty: session.difficulty
            };
          } catch (e2) {
            aiSummaryData = {
              overallScore: 'N/A',
              strengths: 'Analysis could not be completed',
              improvements: text,
              recommendations: 'Please review the session manually',
              technicalAssessment: 'Unable to assess',
              sessionId,
              generatedAt: new Date().toISOString(),
              questionCount: session.questions.length,
              role: session.role,
              difficulty: session.difficulty
            };
          }
        } else {
          aiSummaryData = {
            overallScore: 'N/A',
            strengths: 'Analysis could not be completed',
            improvements: text,
            recommendations: 'Please review the session manually',
            technicalAssessment: 'Unable to assess',
            sessionId,
            generatedAt: new Date().toISOString(),
            questionCount: session.questions.length,
            role: session.role,
            difficulty: session.difficulty
          };
        }
      }

      // Helper function to safely extract array data
      const safeExtractArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        
        if (typeof data === 'string') {
          // Check if it's a JSON string wrapped in markdown code blocks
          if (data.includes('```json') && data.includes('```')) {
            try {
              const jsonMatch = data.match(/```json\s*(\{[\s\S]*?\})\s*```/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.strengths && Array.isArray(parsed.strengths)) return parsed.strengths;
                if (parsed.improvements && Array.isArray(parsed.improvements)) return parsed.improvements;
              }
            } catch (e) {
              // If parsing fails, continue with original string
            }
          }
          
          // Check if it's a plain JSON string
          if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.strengths && Array.isArray(parsed.strengths)) return parsed.strengths;
              if (parsed.improvements && Array.isArray(parsed.improvements)) return parsed.improvements;
            } catch (e) {
              // If parsing fails, continue with original string
            }
          }
          
          return [data];
        }
        
        if (typeof data === 'object') {
          // Try to extract array values from object
          const values = Object.values(data);
          const arrayValues = values.filter(v => Array.isArray(v));
          if (arrayValues.length > 0) return arrayValues[0];
          // Otherwise convert object values to array
          return values.filter(v => typeof v === 'string' && v.length > 0);
        }
        return [data.toString()];
      };

      // Helper function to safely extract string data
      const safeExtractString = (data) => {
        if (!data) return '';
        
        if (typeof data === 'string') {
          // Check if it's a JSON string wrapped in markdown code blocks
          if (data.includes('```json') && data.includes('```')) {
            try {
              const jsonMatch = data.match(/```json\s*(\{[\s\S]*?\})\s*```/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.recommendations && typeof parsed.recommendations === 'string') return parsed.recommendations;
                if (parsed.technicalAssessment && typeof parsed.technicalAssessment === 'string') return parsed.technicalAssessment;
              }
            } catch (e) {
              // If parsing fails, continue with original string
            }
          }
          
          // Check if it's a plain JSON string
          if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.recommendations && typeof parsed.recommendations === 'string') return parsed.recommendations;
              if (parsed.technicalAssessment && typeof parsed.technicalAssessment === 'string') return parsed.technicalAssessment;
            } catch (e) {
              // If parsing fails, continue with original string
            }
          }
          
          return data;
        }
        
        if (Array.isArray(data)) return data.join(' ');
        if (typeof data === 'object') {
          // Try to extract meaningful text from object
          const values = Object.values(data).filter(v => typeof v === 'string' && v.length > 0);
          return values.length > 0 ? values[0] : JSON.stringify(data);
        }
        return data.toString();
      };

      // Helper function to extract overall score from embedded JSON
      const extractOverallScore = (data) => {
        // First try the direct score
        if (data.overallScore !== undefined && data.overallScore !== null && data.overallScore !== 'N/A') {
          return data.overallScore;
        }
        
        // Check if score is embedded in improvements field (as JSON)
        if (data.improvements && Array.isArray(data.improvements)) {
          for (const improvement of data.improvements) {
            if (typeof improvement === 'string' && improvement.includes('```json')) {
              try {
                const jsonMatch = improvement.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[1]);
                  if (parsed.overallScore !== undefined && parsed.overallScore !== null) {
                    return parsed.overallScore;
                  }
                }
              } catch (e) {
                // Continue checking other improvements
              }
            }
          }
        }
        
        return data.overallScore || 'N/A';
      };

      // Extract and clean data with fallbacks
      const extractedOverallScore = extractOverallScore(aiSummaryData);
      const extractedStrengths = safeExtractArray(aiSummaryData.strengths);
      const extractedImprovements = safeExtractArray(aiSummaryData.improvements);
      const extractedRecommendations = safeExtractString(aiSummaryData.recommendations);
      const extractedTechnicalAssessment = safeExtractString(aiSummaryData.technicalAssessment);

      // Create the summary structure that matches what the UI expects
      const summaryData = {
        totalQuestions: session.questions.length,
        totalAnswers: session.answers.length,
        overallScore: extractedOverallScore,
        feedback: extractedRecommendations || 'AI analysis completed successfully.',
        strengths: extractedStrengths.length > 0 ? extractedStrengths : ['Good engagement with the interview process'],
        improvements: extractedImprovements.length > 0 ? extractedImprovements : ['Continue practicing to improve your skills'],
        detailedFeedback: interviewData.map((item, index) => ({
          question: item.question,
          answer: item.answer,
          feedback: `Question ${index + 1} feedback: This answer demonstrates your understanding and approach to the problem.`
        })),
        // Additional AI-generated fields for enhanced UI
        recommendations: extractedRecommendations || 'Continue practicing to improve your interview skills.',
        technicalAssessment: extractedTechnicalAssessment || 'Technical assessment completed.',
        sessionId: aiSummaryData.sessionId,
        generatedAt: aiSummaryData.generatedAt,
        role: aiSummaryData.role,
        difficulty: aiSummaryData.difficulty
      };

      // Cache the summary for 24 hours
      await this.cacheService.set(cacheKey, summaryData, 86400000);
      
      // Update session with summary
      await this.updateSession(sessionId, session.questions, session.answers, summaryData);
      
      return summaryData;
      
    } catch (error) {
      this.logger.error('Error generating interview summary:', error);
      throw new Error(`Failed to generate interview summary: ${error.message}`);
    }
  }

  async endInterviewSession(sessionId: string, userId: string): Promise<any> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      this.validateUserId(userId);

      this.logger.debug(`Ending interview session: ${sessionId}, user: ${userId}`);

      const session = await this.getSession(sessionId, userId);
      
      // Check if session has any interview data
      const hasInterviewData = session.questions && session.answers && session.questions.length > 0;
      
      // Generate summary if there's interview data and either no summary exists 
      // or the existing summary is the default "no questions" summary
      let summary = session.summary;
      
      if (hasInterviewData) {
        // Check if existing summary is the default "no questions" summary
        const hasValidSummary = summary && 
          summary.totalQuestions > 0 && 
          summary.feedback !== 'Session ended without completing any questions.' &&
          summary.overallScore !== undefined && 
          summary.overallScore !== null;
        
        if (!hasValidSummary) {
          this.logger.debug(`Generating AI summary for session with ${session.questions.length} questions`);
          try {
            summary = await this.generateInterviewSummary(sessionId, userId);
          } catch (summaryError) {
            this.logger.warn(`Failed to generate AI summary, using fallback: ${summaryError.message}`);
            // Calculate score from stored per-question evaluations when AI is unavailable
            const evalScores = (session.evaluations ?? [])
              .filter(e => e && typeof e.score === 'number')
              .map(e => e.score as number);
            const calculatedScore = evalScores.length > 0
              ? Math.round(evalScores.reduce((a, b) => a + b, 0) / evalScores.length)
              : 6;
            summary = {
              totalQuestions: session.questions.length,
              totalAnswers: session.answers.length,
              overallScore: calculatedScore,
              feedback: 'Interview completed successfully. AI analysis is temporarily unavailable — your score is based on per-question evaluations.',
              strengths: ['Completed the interview session', 'Demonstrated effort across all questions'],
              improvements: ['Continue practicing to sharpen your answers', 'Review topics covered in this session'],
              detailedFeedback: session.questions.map((q, index) => ({
                question: q,
                answer: session.answers[index] || 'No answer provided',
                feedback: session.evaluations?.[index]?.feedback || 'Answer recorded successfully.',
              })),
            };
          }
        }
      } else {
        // Provide a default summary for sessions with no data
        summary = {
          totalQuestions: 0,
          totalAnswers: 0,
          overallScore: 0,
          feedback: 'Session ended without completing any questions.',
          strengths: [],
          improvements: [],
          detailedFeedback: []
        };
      }

      // Mark session as completed
      const updatedSession = await this.updateSessionData(sessionId, userId, {
        completed: true,
        status: 'completed',
        summary: summary,
        updatedAt: new Date()
      });

      // Deduct session credit now that the interview is completed
      await this.usersService.deductSessionCredit(userId);

      // Clear relevant caches
      await this.cacheService.del(`user_sessions:${userId}`);
      await this.cacheService.del(`user_progress:${userId}`);
      await this.cacheService.del(`session:${sessionId}:${userId}`);
      
      return {
        session: updatedSession,
        summary: summary
      };
      
    } catch (error) {
      this.logger.error('Error ending interview session:', error);
      throw new Error(`Failed to end interview session: ${error.message}`);
    }
  }

  async addQuestionAnswer(sessionId: string, userId: string, question: string, answer: string, evaluation?: any): Promise<InterviewSession> {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID is required and must be a string');
      }
      this.validateUserId(userId);
      if (!question || typeof question !== 'string') {
        throw new Error('Question is required and must be a string');
      }
      if (!answer || typeof answer !== 'string') {
        throw new Error('Answer is required and must be a string');
      }

      this.logger.debug(`Adding Q&A to session: ${sessionId}, user: ${userId}`);

      const session = await this.getSession(sessionId, userId);
      
      // Ensure questions, answers, and evaluations are arrays
      const questions = Array.isArray(session.questions) ? [...session.questions] : [];
      const answers = Array.isArray(session.answers) ? [...session.answers] : [];
      const evaluations = Array.isArray(session.evaluations) ? [...session.evaluations] : [];
      
      // Handle legacy sessions without evaluations array
      while (evaluations.length < answers.length) {
        evaluations.push(null);
      }
      
      // Add the new question, answer, and evaluation
      questions.push(question);
      answers.push(answer);
      evaluations.push(evaluation || null);

      // Update session status to in_progress if it was active
      let status = session.status;
      if (status === 'active') {
        status = 'in_progress';
      }

      const updatedSession = await this.updateSessionData(sessionId, userId, {
        questions: questions,
        answers: answers,
        evaluations: evaluations,
        status: status
      });

      // Clear user sessions cache to reflect updates
      await this.cacheService.del(`user_sessions:${userId}`);
      
      // Clear session cache to force fresh load with new evaluation data
      await this.cacheService.del(`session:${sessionId}:${userId}`);

      return updatedSession;
      
    } catch (error) {
      this.logger.error('Error adding question-answer pair:', error);
      throw new Error(`Failed to add question-answer pair: ${error.message}`);
    }
  }

    async getUserProgress(userId: string): Promise<any> {
    try {
      this.validateUserId(userId);

      this.logger.debug(`Getting user progress for: ${userId}`);

      // Try to get from cache first
      const cacheKey = `user_progress:${userId}`;
      const cachedProgress = await this.cacheService.get<any>(cacheKey);
      
      if (cachedProgress && typeof cachedProgress === 'object') {
        this.logger.debug(`Cache hit for user progress: ${userId}`);
        return {
          ...cachedProgress,
          fromCache: true
        };
      }

      const sessions = await this.getUserSessions(userId);
      
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.completed && s.status === 'completed');
      const activeSessions = sessions.filter(s => s.status === 'active');
      const inProgressSessions = sessions.filter(s => (s.status === 'in_progress' || s.status === 'active') && !s.completed);

      // Calculate average score from completed sessions with summaries
      let totalScore = 0;
      let scoreCount = 0;
      completedSessions.forEach(session => {
        if (session.summary && session.summary.overallScore !== undefined && session.summary.overallScore !== null) {
          const score = parseFloat(session.summary.overallScore);
          if (!isNaN(score) && score >= 0) { // Accept scores >= 0 (including 0)
            totalScore += score;
            scoreCount++;
          }
        }
      });
      const averageScore = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : null;

      // Calculate role frequency
      const roleCount: Record<string, number> = {};
      sessions.forEach(session => {
        roleCount[session.role] = (roleCount[session.role] || 0) + 1;
      });
      const topRoles = Object.entries(roleCount)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([role, count]) => ({ role, count: count as number }));

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSessions = sessions.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= thirtyDaysAgo;
      });

      // Weekly progress (last 7 days)
      const weeklyProgress: Array<{ date: string; fullDate: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const daySessionsCount = sessions.filter(session => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate.toDateString() === date.toDateString();
        }).length;
        
        weeklyProgress.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toISOString().split('T')[0],
          count: daySessionsCount
        });
      }

      // Calculate streak (consecutive days with activity)
      let streakDays = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const hasActivity = sessions.some(session => {
          const sessionDate = new Date(session.createdAt);
          return sessionDate.toDateString() === checkDate.toDateString();
        });
        
        if (hasActivity) {
          streakDays++;
        } else if (i > 0) { // Don't break on day 0 (today) if no activity
          break;
        }
      }

      const progressData = {
        totalSessions,
        completedSessions: completedSessions.length,
        activeSessions: activeSessions.length,
        inProgressSessions: inProgressSessions.length,
        averageScore,
        streakDays,
        topRoles,
        recentSessions: recentSessions.length,
        weeklyProgress,
        lastSessionDate: sessions.length > 0 ? sessions[0].createdAt : null,
        generatedAt: new Date().toISOString()
      };

      // Cache the progress for 30 minutes
      await this.cacheService.set(cacheKey, progressData, 1800000);
      
      return progressData;
      
    } catch (error) {
      this.logger.error('Error getting user progress:', error);
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }
}