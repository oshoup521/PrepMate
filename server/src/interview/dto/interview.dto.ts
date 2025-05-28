import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, Max, Length, IsArray, ValidateNested, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsNotEmpty({ message: 'Job role is required' })
  @IsString({ message: 'Job role must be a string' })
  @Length(2, 100, { message: 'Job role must be between 2 and 100 characters' })
  jobRole: string;

  @IsNotEmpty({ message: 'Difficulty level is required' })
  @IsEnum(['easy', 'medium', 'hard'], { message: 'Difficulty must be easy, medium, or hard' })
  difficulty: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 500, { message: 'Description must be less than 500 characters' })
  description?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsArray({ message: 'Questions must be an array' })
  questions?: any[];

  @IsOptional()
  @IsArray({ message: 'Answers must be an array' })
  answers?: any[];

  @IsOptional()
  @IsString({ message: 'Current question must be a string' })
  currentQuestion?: string;

  @IsOptional()
  @IsString({ message: 'Current answer must be a string' })
  currentAnswer?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Score must be a number' })
  @Min(0, { message: 'Score must be at least 0' })
  @Max(100, { message: 'Score must be at most 100' })
  score?: number;

  @IsOptional()
  @IsString({ message: 'Feedback must be a string' })
  feedback?: string;

  @IsOptional()
  @IsBoolean({ message: 'Completed must be a boolean' })
  completed?: boolean;

  @IsOptional()
  summary?: any;
}

export class GenerateQuestionDto {
  @IsNotEmpty({ message: 'Job role is required' })
  @IsString({ message: 'Job role must be a string' })
  @Length(2, 100, { message: 'Job role must be between 2 and 100 characters' })
  jobRole: string;

  @IsNotEmpty({ message: 'Difficulty level is required' })
  @IsEnum(['easy', 'medium', 'hard'], { message: 'Difficulty must be easy, medium, or hard' })
  difficulty: string;

  @IsOptional()
  @IsString({ message: 'Context must be a string' })
  @Length(0, 1000, { message: 'Context must be less than 1000 characters' })
  context?: string;
}

export class EvaluateAnswerDto {
  @IsNotEmpty({ message: 'Question is required' })
  @IsString({ message: 'Question must be a string' })
  @Length(1, 2000, { message: 'Question must be between 1 and 2000 characters' })
  question: string;

  @IsNotEmpty({ message: 'Answer is required' })
  @IsString({ message: 'Answer must be a string' })
  @Length(1, 5000, { message: 'Answer must be between 1 and 5000 characters' })
  answer: string;

  @IsNotEmpty({ message: 'Job role is required' })
  @IsString({ message: 'Job role must be a string' })
  @Length(2, 100, { message: 'Job role must be between 2 and 100 characters' })
  jobRole: string;
}

export class SessionParamsDto {
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;
}

export class GenerateSummaryDto {
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;
}
