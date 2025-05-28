import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { ConfigModule } from '@nestjs/config';
import { InterviewSession } from './entities/interview-session.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([InterviewSession])
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
