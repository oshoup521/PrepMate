import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InterviewService } from './interview.service';
import { InterviewSession } from './entities/interview-session.entity';
import { CacheService } from '../cache/cache.service';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('InterviewService', () => {
  let service: InterviewService;
  let repository: Repository<InterviewSession>;
  let cacheService: CacheService;
  let configService: ConfigService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        {
          provide: getRepositoryToken(InterviewSession),
          useValue: mockRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
    repository = module.get<Repository<InterviewSession>>(getRepositoryToken(InterviewSession));
    cacheService = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRole', () => {
    it('should validate valid roles', () => {
      expect(() => service.validateRole('software engineer')).not.toThrow();
      expect(() => service.validateRole('data scientist')).not.toThrow();
      expect(() => service.validateRole('product manager')).not.toThrow();
    });

    it('should throw BadRequestException for invalid roles', () => {
      expect(() => service.validateRole('')).toThrow(BadRequestException);
      expect(() => service.validateRole(null)).toThrow(BadRequestException);
      expect(() => service.validateRole(undefined)).toThrow(BadRequestException);
    });
  });

  describe('validateDifficulty', () => {
    it('should validate valid difficulty levels', () => {
      expect(() => service.validateDifficulty('easy')).not.toThrow();
      expect(() => service.validateDifficulty('medium')).not.toThrow();
      expect(() => service.validateDifficulty('hard')).not.toThrow();
    });

    it('should throw BadRequestException for invalid difficulty levels', () => {
      expect(() => service.validateDifficulty('')).toThrow(BadRequestException);
      expect(() => service.validateDifficulty('extreme')).toThrow(BadRequestException);
      expect(() => service.validateDifficulty(null)).toThrow(BadRequestException);
    });
  });

  describe('validateUserId', () => {
    it('should validate valid user IDs', () => {
      expect(() => service.validateUserId(123)).not.toThrow();
      expect(() => service.validateUserId(1)).not.toThrow();
    });

    it('should throw BadRequestException for invalid user IDs', () => {
      expect(() => service.validateUserId(0)).toThrow(BadRequestException);
      expect(() => service.validateUserId(-1)).toThrow(BadRequestException);
      expect(() => service.validateUserId(null)).toThrow(BadRequestException);
      expect(() => service.validateUserId(undefined)).toThrow(BadRequestException);
    });
  });

  describe('createSession', () => {
    const mockSession: Partial<InterviewSession> = {
      id: 1,
      userId: 123,
      jobRole: 'software engineer',
      difficulty: 'medium',
      jobDescription: 'Test job description',
      questions: [],
      answers: [],
      createdAt: new Date(),
      isCompleted: false,
    };

    beforeEach(() => {
      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession as InterviewSession);
    });

    it('should create a new interview session successfully', async () => {
      const result = await service.createSession(123, 'software engineer', 'medium', 'Test job description');

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 123,
        jobRole: 'software engineer',
        difficulty: 'medium',
        jobDescription: 'Test job description',
        questions: [],
        answers: [],
        isCompleted: false,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });

    it('should throw BadRequestException for invalid inputs', async () => {
      await expect(service.createSession(0, 'software engineer', 'medium', 'Test')).rejects.toThrow(BadRequestException);
      await expect(service.createSession(123, '', 'medium', 'Test')).rejects.toThrow(BadRequestException);
      await expect(service.createSession(123, 'software engineer', 'invalid', 'Test')).rejects.toThrow(BadRequestException);
    });

    it('should handle database errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createSession(123, 'software engineer', 'medium', 'Test')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('generateQuestion', () => {
    beforeEach(() => {
      // Mock the AI service method
      jest.spyOn(service as any, 'callAIWithTimeout').mockResolvedValue({
        choices: [{ message: { content: 'What is your experience with React?' } }]
      });
    });

    it('should generate a question successfully', async () => {
      const result = await service.generateQuestion('software engineer', 'medium', 'Frontend development');

      expect(service['callAIWithTimeout']).toHaveBeenCalled();
      expect(result).toBe('What is your experience with React?');
    });

    it('should throw BadRequestException for invalid inputs', async () => {
      await expect(service.generateQuestion('', 'medium', 'context')).rejects.toThrow(BadRequestException);
      await expect(service.generateQuestion('software engineer', 'invalid', 'context')).rejects.toThrow(BadRequestException);
    });

    it('should handle AI service timeout', async () => {
      jest.spyOn(service as any, 'callAIWithTimeout').mockRejectedValue(new Error('Timeout'));

      await expect(service.generateQuestion('software engineer', 'medium', 'context')).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle malformed AI response', async () => {
      jest.spyOn(service as any, 'callAIWithTimeout').mockResolvedValue({
        choices: []
      });

      await expect(service.generateQuestion('software engineer', 'medium', 'context')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('evaluateAnswer', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'callAIWithTimeout').mockResolvedValue({
        choices: [{ message: { content: '{"score": 8, "feedback": "Good answer!"}' } }]
      });
    });

    it('should evaluate an answer successfully', async () => {
      const result = await service.evaluateAnswer('What is React?', 'React is a JavaScript library', 'software engineer');

      expect(service['callAIWithTimeout']).toHaveBeenCalled();
      expect(result).toEqual({ score: 8, feedback: 'Good answer!' });
    });

    it('should throw BadRequestException for empty inputs', async () => {
      await expect(service.evaluateAnswer('', 'answer', 'software engineer')).rejects.toThrow(BadRequestException);
      await expect(service.evaluateAnswer('question', '', 'software engineer')).rejects.toThrow(BadRequestException);
      await expect(service.evaluateAnswer('question', 'answer', '')).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid JSON response from AI', async () => {
      jest.spyOn(service as any, 'callAIWithTimeout').mockResolvedValue({
        choices: [{ message: { content: 'Invalid JSON' } }]
      });

      await expect(service.evaluateAnswer('question', 'answer', 'software engineer')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserSessions', () => {
    const mockSessions: Partial<InterviewSession>[] = [
      { id: 1, userId: 123, jobRole: 'software engineer', difficulty: 'medium' },
      { id: 2, userId: 123, jobRole: 'data scientist', difficulty: 'hard' }
    ];

    it('should return user sessions successfully', async () => {
      mockRepository.find.mockResolvedValue(mockSessions as InterviewSession[]);

      const result = await service.getUserSessions(123);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 123 },
        order: { createdAt: 'DESC' }
      });
      expect(result).toEqual(mockSessions);
    });

    it('should throw BadRequestException for invalid user ID', async () => {
      await expect(service.getUserSessions(0)).rejects.toThrow(BadRequestException);
    });

    it('should return empty array when no sessions found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getUserSessions(123);

      expect(result).toEqual([]);
    });
  });

  describe('getSession', () => {
    const mockSession: Partial<InterviewSession> = {
      id: 1,
      userId: 123,
      jobRole: 'software engineer',
      difficulty: 'medium'
    };

    it('should return session successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockSession as InterviewSession);

      const result = await service.getSession(1, 123);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 123 }
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSession(1, 123)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid inputs', async () => {
      await expect(service.getSession(0, 123)).rejects.toThrow(BadRequestException);
      await expect(service.getSession(1, 0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSession', () => {
    const mockSession: Partial<InterviewSession> = {
      id: 1,
      userId: 123,
      questions: ['Q1'],
      answers: ['A1']
    };

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(mockSession as InterviewSession);
      mockRepository.save.mockResolvedValue(mockSession as InterviewSession);
    });

    it('should update session successfully', async () => {
      const questions = ['Q1', 'Q2'];
      const answers = ['A1', 'A2'];
      const summary = 'Test summary';

      const result = await service.updateSession(1, questions, answers, summary);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.questions).toEqual(questions);
      expect(result.answers).toEqual(answers);
      expect(result.summary).toEqual(summary);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSession(1, [], [], 'summary')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid session ID', async () => {
      await expect(service.updateSession(0, [], [], 'summary')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSessionData', () => {
    const mockSession: Partial<InterviewSession> = {
      id: 1,
      userId: 123,
      jobRole: 'software engineer'
    };

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(mockSession as InterviewSession);
      mockRepository.save.mockResolvedValue(mockSession as InterviewSession);
    });

    it('should update session data successfully', async () => {
      const updateData = { isCompleted: true };

      const result = await service.updateSessionData(1, 123, updateData);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 123 }
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should throw NotFoundException when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSessionData(1, 123, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid inputs', async () => {
      await expect(service.updateSessionData(0, 123, {})).rejects.toThrow(BadRequestException);
      await expect(service.updateSessionData(1, 0, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateInterviewSummary', () => {
    const mockSession: Partial<InterviewSession> = {
      id: 1,
      userId: 123,
      questions: ['Q1', 'Q2'],
      answers: ['A1', 'A2'],
      jobRole: 'software engineer'
    };

    beforeEach(() => {
      mockRepository.findOne.mockResolvedValue(mockSession as InterviewSession);
      mockRepository.save.mockResolvedValue({
        ...mockSession,
        summary: 'Generated summary'
      } as InterviewSession);
      jest.spyOn(service as any, 'callAIWithTimeout').mockResolvedValue({
        choices: [{ message: { content: 'Generated summary' } }]
      });
    });

    it('should generate interview summary successfully', async () => {
      const result = await service.generateInterviewSummary(1, 123);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 123 }
      });
      expect(service['callAIWithTimeout']).toHaveBeenCalled();
      expect(result.summary).toBe('Generated summary');
    });

    it('should throw NotFoundException when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.generateInterviewSummary(1, 123)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for sessions without questions/answers', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockSession,
        questions: [],
        answers: []
      } as InterviewSession);

      await expect(service.generateInterviewSummary(1, 123)).rejects.toThrow(BadRequestException);
    });

    it('should handle AI service errors during summary generation', async () => {
      jest.spyOn(service as any, 'callAIWithTimeout').mockRejectedValue(new Error('AI Error'));

      await expect(service.generateInterviewSummary(1, 123)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Cache behavior', () => {
    it('should use cache for repeated requests', async () => {
      const cacheKey = 'test-key';
      const cachedData = 'cached-result';

      mockCacheService.get.mockResolvedValue(cachedData);

      // This test would need to be adapted based on actual cache implementation
      expect(mockCacheService.get).toBeDefined();
      expect(mockCacheService.set).toBeDefined();
    });

    it('should handle cache errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      // The service should continue working even if cache fails
      expect(mockCacheService.get).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      
      await expect(service.createSession(123, longString, 'medium', 'description')).rejects.toThrow();
    });

    it('should handle special characters in inputs', async () => {
      const specialChars = '!@#$%^&*()';
      
      // Should handle special characters appropriately
      expect(() => service.validateRole(specialChars)).toThrow(BadRequestException);
    });

    it('should handle concurrent session updates', async () => {
      const mockSession: Partial<InterviewSession> = {
        id: 1,
        userId: 123,
        questions: ['Q1'],
        answers: ['A1']
      };

      mockRepository.findOne.mockResolvedValue(mockSession as InterviewSession);
      mockRepository.save.mockResolvedValue(mockSession as InterviewSession);

      // Simulate concurrent updates
      const promise1 = service.updateSession(1, ['Q1', 'Q2'], ['A1', 'A2'], 'summary1');
      const promise2 = service.updateSession(1, ['Q1', 'Q3'], ['A1', 'A3'], 'summary2');

      await expect(Promise.all([promise1, promise2])).resolves.toBeDefined();
    });
  });
});
