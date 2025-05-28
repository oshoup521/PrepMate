import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InterviewSession } from './entities/interview-session.entity';
import { CacheService } from '../cache/cache.service';

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
  ) {    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'YOUR_API_KEY');
    
    // Use model from environment variable or fallback to gemini-1.5-pro
    const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-pro';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  private validateRole(role: string): void {
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('Role is required and must be a non-empty string');
    }
    if (role.length > 100) {
      throw new Error('Role must be less than 100 characters');
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
  }  private async callAIWithTimeout<T>(
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
      // Validate inputs
      this.validateRole(role);
      this.validateDifficulty(difficulty);

      // Try to get from cache first
      const cacheKey = `question:${role}:${difficulty}:${context || 'default'}`;
      const cachedQuestion = await this.cacheService.get<any>(cacheKey);
      
      if (cachedQuestion && typeof cachedQuestion === 'object' && cachedQuestion.question) {
        this.logger.debug(`Cache hit for question generation: ${cacheKey}`);
        return {
          ...cachedQuestion,
          fromCache: true,
          timestamp: new Date().toISOString()
        };
      }

      this.logger.debug(`Generating new question for role: ${role}, difficulty: ${difficulty}`);

      const difficultyMap = {
        easy: 'beginner-level',
        medium: 'intermediate-level', 
        hard: 'advanced-level'
      };
      
      const actualDifficulty = difficultyMap[difficulty] || 'intermediate-level';
      const contextPrompt = context ? `Context: ${context}\n` : '';
      
      const prompt = `Generate a ${actualDifficulty} interview question for a ${role} position.
                     ${contextPrompt}
                     Make it specific, relevant, and appropriate for the role and difficulty level.
                     Format the response as JSON with 'question' and 'context' fields.
                     The 'context' should include the ideal answer points the candidate should cover.`;

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

      // Cache the generated question for 30 minutes
      await this.cacheService.set(cacheKey, questionData, 1800000);
        return questionData;
      
    } catch (error) {
      this.logger.error('Error generating question:', error);
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  }  async evaluateAnswer(question: string, answer: string, role: string): Promise<any> {
    try {
      // Validate inputs
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

      const prompt = `You are an expert ${role} interviewer evaluating a candidate's answer.
                     Question: "${question}"
                     Candidate's answer: "${answer}"
                     
                     Evaluate the answer on technical accuracy, completeness, and clarity.
                     Provide a score from 1-10 and specific, constructive feedback.
                     Format the response as JSON with 'score', 'feedback', and 'improvement_areas' fields.`;

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
  async createSession(
    userId: string, 
    jobRole: string, 
    difficulty: string = 'medium',
    description?: string
  ): Promise<InterviewSession> {
    try {
      // Validate inputs
      this.validateUserId(userId);
      this.validateRole(jobRole);
      this.validateDifficulty(difficulty);
      
      if (description && description.length > 500) {
        throw new Error('Description must be less than 500 characters');
      }

      this.logger.debug(`Creating session for user: ${userId}, role: ${jobRole}, difficulty: ${difficulty}`);      const session = this.interviewSessionRepository.create({
        userId,
        role: jobRole,
        difficulty,
        description,
        questions: [],
        answers: [],
        completed: false,
        status: 'active', // Set initial status
      });
      
      const savedSession = await this.interviewSessionRepository.save(session);
      
      // Cache the session for quick access
      await this.cacheService.cacheUserSession(userId, savedSession);
      
      return savedSession;
    } catch (error) {
      this.logger.error('Error creating session:', error);
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
        answer: session.answers[index] || 'No answer provided'
      }));

      const prompt = `Analyze this ${session.role} interview session and provide a comprehensive summary.
                     
                     Interview Data:
                     ${JSON.stringify(interviewData, null, 2)}
                     
                     Role: ${session.role}
                     Difficulty: ${session.difficulty}
                     
                     Please provide:
                     1. Overall performance score (1-10)
                     2. Key strengths demonstrated
                     3. Areas for improvement
                     4. Specific recommendations for skill development
                     5. Technical competency assessment
                     
                     Format the response as JSON with fields: 'overallScore', 'strengths', 'improvements', 'recommendations', 'technicalAssessment'.`;

      const text = await this.callAIWithTimeout<string>(prompt, 45000); // Longer timeout for summary generation

      let summaryData;

      try {
        const parsedResponse = JSON.parse(text);
        summaryData = {
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
            summaryData = {
              ...parsed,
              sessionId,
              generatedAt: new Date().toISOString(),
              questionCount: session.questions.length,
              role: session.role,
              difficulty: session.difficulty
            };
          } catch (e2) {
            summaryData = {
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
          summaryData = {
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
      
      if (!session.questions || !session.answers || session.questions.length === 0) {
        throw new Error('Cannot end session with no interview data');
      }

      // Generate summary if not already generated
      let summary = session.summary;
      if (!summary) {
        summary = await this.generateInterviewSummary(sessionId, userId);
      }

      // Mark session as completed
      const updatedSession = await this.updateSessionData(sessionId, userId, {
        completed: true,
        status: 'completed',
        summary: summary,
        updatedAt: new Date()
      });

      // Clear relevant caches
      await this.cacheService.del(`user_sessions:${userId}`);
      await this.cacheService.del(`session:${sessionId}:${userId}`);

      return {
        session: updatedSession,
        summary: summary,
        message: 'Interview session ended successfully'
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
      
      // Ensure questions and answers are arrays
      const questions = Array.isArray(session.questions) ? [...session.questions] : [];
      const answers = Array.isArray(session.answers) ? [...session.answers] : [];
      
      // Add the new question and answer
      questions.push(question);
      answers.push(answer);

      // Update session status to in_progress if it was active
      let status = session.status;
      if (status === 'active') {
        status = 'in_progress';
      }

      const updatedSession = await this.updateSessionData(sessionId, userId, {
        questions: questions,
        answers: answers,
        status: status
      });

      // Clear user sessions cache to reflect updates
      await this.cacheService.del(`user_sessions:${userId}`);

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
      const inProgressSessions = sessions.filter(s => s.status === 'in_progress' && !s.completed);

      // Calculate average score from completed sessions with summaries
      let totalScore = 0;
      let scoreCount = 0;
      completedSessions.forEach(session => {
        if (session.summary && session.summary.overallScore && !isNaN(parseFloat(session.summary.overallScore))) {
          totalScore += parseFloat(session.summary.overallScore);
          scoreCount++;
        }
      });
      const averageScore = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : 0;

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

      // Cache progress for 30 minutes
      await this.cacheService.set(cacheKey, progressData, 1800000);
      
      return progressData;
      
    } catch (error) {
      this.logger.error('Error getting user progress:', error);
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }
}
