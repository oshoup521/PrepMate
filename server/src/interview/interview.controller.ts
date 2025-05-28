import { 
  Body, 
  Controller, 
  Post, 
  UseGuards, 
  Request, 
  Get, 
  Param, 
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InterviewService } from './interview.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  CreateSessionDto, 
  UpdateSessionDto, 
  GenerateQuestionDto, 
  EvaluateAnswerDto,
  SessionParamsDto,
  GenerateSummaryDto
} from './dto/interview.dto';

@ApiTags('interview')
@ApiBearerAuth()
@Controller('interview')
@UseGuards(ThrottlerGuard)
export class InterviewController {
  private readonly logger = new Logger(InterviewController.name);

  constructor(private readonly interviewService: InterviewService) {}

  @ApiOperation({ summary: 'Create a new interview session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateSessionDto })
  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Request() req,
    @Body() createSessionDto: CreateSessionDto
  ) {
    try {
      this.logger.debug(`Creating session for user: ${req.user.id}`);
      return await this.interviewService.createSession(
        req.user.id, 
        createSessionDto.jobRole, 
        createSessionDto.difficulty,
        createSessionDto.description
      );
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`);
      if (error.message.includes('required') || error.message.includes('validation')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get all sessions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    try {
      this.logger.debug(`Getting sessions for user: ${req.user.id}`);
      return await this.interviewService.getUserSessions(req.user.id);
    } catch (error) {
      this.logger.error(`Error getting user sessions: ${error.message}`);
      throw error;
    }
  }
  @ApiOperation({ summary: 'Get a specific interview session' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id')
  async getSession(
    @Request() req, 
    @Param('id', ParseUUIDPipe) sessionId: string
  ) {
    try {
      this.logger.debug(`Getting session: ${sessionId} for user: ${req.user.id}`);
      const session = await this.interviewService.getSession(sessionId, req.user.id);
      return session;
    } catch (error) {
      this.logger.error(`Error getting session: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new NotFoundException('Session not found');
      }
      if (error.message.includes('access denied')) {
        throw new ForbiddenException('Access denied');
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Update an interview session' })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiBody({ type: UpdateSessionDto })
  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/update')
  async updateSession(
    @Request() req,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto
  ) {
    try {
      this.logger.debug(`Updating session: ${sessionId} for user: ${req.user.id}`);
      return await this.interviewService.updateSessionData(
        sessionId, 
        req.user.id,
        updateSessionDto
      );
    } catch (error) {
      this.logger.error(`Error updating session: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new NotFoundException('Session not found');
      }
      if (error.message.includes('validation') || error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Generate an interview question' })
  @ApiResponse({ status: 200, description: 'Question generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: GenerateQuestionDto })
  @UseGuards(JwtAuthGuard)
  @Post('generate-question')
  async generateQuestion(
    @Request() req,
    @Body() generateQuestionDto: GenerateQuestionDto
  ) {
    try {
      this.logger.debug(`Generating question for role: ${generateQuestionDto.jobRole}`);
      return await this.interviewService.generateQuestion(
        generateQuestionDto.jobRole, 
        generateQuestionDto.difficulty,
        generateQuestionDto.context
      );
    } catch (error) {
      this.logger.error(`Error generating question: ${error.message}`);
      if (error.message.includes('validation') || error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Evaluate an interview answer' })
  @ApiResponse({ status: 200, description: 'Answer evaluated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: EvaluateAnswerDto })
  @UseGuards(JwtAuthGuard)
  @Post('evaluate-answer')
  async evaluateAnswer(
    @Request() req,
    @Body() evaluateAnswerDto: EvaluateAnswerDto
  ) {
    try {
      this.logger.debug(`Evaluating answer for role: ${evaluateAnswerDto.jobRole}`);
      return await this.interviewService.evaluateAnswer(
        evaluateAnswerDto.question, 
        evaluateAnswerDto.answer, 
        evaluateAnswerDto.jobRole
      );
    } catch (error) {
      this.logger.error(`Error evaluating answer: ${error.message}`);
      if (error.message.includes('validation') || error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Generate interview summary' })
  @ApiResponse({ status: 200, description: 'Summary generated successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/summary')
  async generateSummary(
    @Request() req,
    @Param('id', ParseUUIDPipe) sessionId: string
  ) {
    try {
      this.logger.debug(`Generating summary for session: ${sessionId}`);
      return await this.interviewService.generateInterviewSummary(sessionId, req.user.id);
    } catch (error) {
      this.logger.error(`Error generating summary: ${error.message}`);
      if (error.message.includes('not found')) {
        throw new NotFoundException('Session not found or no data available');
      }
      throw error;
    }
  }
}
