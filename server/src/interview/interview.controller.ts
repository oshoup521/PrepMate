import { Body, Controller, Post } from '@nestjs/common';
import { InterviewService } from './interview.service';

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('generate-question')
  async generateQuestion(@Body() body: { role: string; difficulty?: string }) {
    const { role, difficulty = 'medium' } = body;
    return this.interviewService.generateQuestion(role, difficulty);
  }

  @Post('evaluate-answer')
  async evaluateAnswer(@Body() body: { question: string; answer: string; role: string }) {
    const { question, answer, role } = body;
    return this.interviewService.evaluateAnswer(question, answer, role);
  }
}
