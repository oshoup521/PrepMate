import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../interview/entities/interview-session.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('InterviewController (Integration)', () => {
  let app: INestApplication;
  let sessionRepository: Repository<InterviewSession>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    sessionRepository = moduleFixture.get<Repository<InterviewSession>>(getRepositoryToken(InterviewSession));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await sessionRepository.clear();
    await userRepository.clear();
  });

  describe('/interview/session (POST)', () => {
    it('should create a new interview session', async () => {
      // Create a test user
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      // Generate JWT token
      const token = jwtService.sign({ sub: user.id, email: user.email });

      const createSessionDto = {
        role: 'Software Engineer',
        difficulty: 'medium',
        description: 'Test interview session',
      };

      const response = await request(app.getHttpServer())
        .post('/interview/session')
        .set('Authorization', `Bearer ${token}`)
        .send(createSessionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.role).toBe(createSessionDto.role);
      expect(response.body.difficulty).toBe(createSessionDto.difficulty);
      expect(response.body.completed).toBe(false);

      // Verify session was saved to database
      const savedSession = await sessionRepository.findOne({
        where: { id: response.body.id },
        relations: ['user'],
      });
      expect(savedSession).toBeDefined();
      expect(savedSession.user.id).toBe(user.id);
    });

    it('should return 400 for invalid input', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const invalidDto = {
        role: '', // Invalid empty role
        difficulty: 'invalid_difficulty',
      };

      await request(app.getHttpServer())
        .post('/interview/session')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 for unauthorized request', async () => {
      const createSessionDto = {
        role: 'Software Engineer',
        difficulty: 'medium',
      };

      await request(app.getHttpServer())
        .post('/interview/session')
        .send(createSessionDto)
        .expect(401);
    });
  });

  describe('/interview/question (POST)', () => {
    it('should generate a question', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const questionDto = {
        role: 'Software Engineer',
        difficulty: 'medium',
      };

      // Mock the OpenAI API call
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                question: 'What is the difference between let and var in JavaScript?',
                category: 'JavaScript',
              })
            }
          }]
        })
      } as any);

      const response = await request(app.getHttpServer())
        .post('/interview/question')
        .set('Authorization', `Bearer ${token}`)
        .send(questionDto)
        .expect(201);

      expect(response.body).toHaveProperty('question');
      expect(typeof response.body.question).toBe('string');
    });

    it('should handle rate limiting', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const questionDto = {
        role: 'Software Engineer',
        difficulty: 'medium',
      };

      // Mock successful response
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({ question: 'Test question' }) } }]
        })
      } as any);

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/interview/question')
          .set('Authorization', `Bearer ${token}`)
          .send(questionDto)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('/interview/evaluate (POST)', () => {
    it('should evaluate an answer', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const evaluateDto = {
        question: 'What is React?',
        answer: 'React is a JavaScript library for building user interfaces',
        role: 'Frontend Developer',
        difficulty: 'easy',
      };

      // Mock the OpenAI API call
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                score: 8,
                feedback: 'Good answer!',
                improvement_areas: ['Could mention components'],
              })
            }
          }]
        })
      } as any);

      const response = await request(app.getHttpServer())
        .post('/interview/evaluate')
        .set('Authorization', `Bearer ${token}`)
        .send(evaluateDto)
        .expect(201);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body.score).toBe(8);
      expect(response.body.feedback).toBe('Good answer!');
    });
  });

  describe('/interview/sessions (GET)', () => {
    it('should return user sessions', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      // Create test sessions
      await sessionRepository.save([
        {
          role: 'Software Engineer',
          difficulty: 'medium',
          completed: true,
          user,
        },
        {
          role: 'Product Manager',
          difficulty: 'hard',
          completed: false,
          user,
        },
      ]);

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const response = await request(app.getHttpServer())
        .get('/interview/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('role');
      expect(response.body[0]).toHaveProperty('difficulty');
      expect(response.body[0]).toHaveProperty('completed');
    });

    it('should return empty array for user with no sessions', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const response = await request(app.getHttpServer())
        .get('/interview/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('/interview/session/:id (PATCH)', () => {
    it('should update session data', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const session = await sessionRepository.save({
        role: 'Software Engineer',
        difficulty: 'medium',
        completed: false,
        user,
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      const updateDto = {
        completed: true,
        summary: {
          overallScore: 8.5,
          totalQuestions: 5,
        },
      };

      const response = await request(app.getHttpServer())
        .patch(`/interview/session/${session.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.completed).toBe(true);
      expect(response.body.summary).toEqual(updateDto.summary);

      // Verify in database
      const updatedSession = await sessionRepository.findOne({
        where: { id: session.id },
      });
      expect(updatedSession.completed).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const user = await userRepository.save({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const token = jwtService.sign({ sub: user.id, email: user.email });

      await request(app.getHttpServer())
        .patch('/interview/session/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true })
        .expect(404);
    });
  });
});
