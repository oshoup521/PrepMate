import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class InterviewService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY not found in environment variables');
    }
      this.genAI = new GoogleGenerativeAI(apiKey || 'YOUR_API_KEY');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async generateQuestion(role: string, difficulty: string): Promise<any> {
    try {
      const prompt = `You are an interviewer for a ${role} position. 
                     Generate a ${difficulty} difficulty technical interview question
                     that would be appropriate for this role.
                     Format the response as JSON with 'question' and 'context' fields.
                     The 'context' should include the ideal answer points the candidate should cover.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();      try {
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(text);
        return parsedResponse;
      } catch (e) {
        // If parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e2) {
            // If that fails too, return the raw text with a default structure
            return {
              question: text,
              context: 'No structured context available'
            };
          }
        } else {
          // If no JSON pattern found, return the raw text
          return {
            question: text,
            context: 'No structured context available'
          };
        }
      }
    } catch (error) {
      console.error('Error generating question:', error);
      return {
        error: 'Failed to generate question',
        details: error.message
      };
    }
  }

  async evaluateAnswer(question: string, answer: string, role: string): Promise<any> {
    try {
      const prompt = `You are an expert ${role} interviewer evaluating a candidate's answer.
                     Question: "${question}"
                     Candidate's answer: "${answer}"
                     
                     Evaluate the answer on technical accuracy, completeness, and clarity.
                     Provide a score from 1-10 and specific, constructive feedback.
                     Format the response as JSON with 'score', 'feedback', and 'improvement_areas' fields.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();      try {
        // Try to parse the response as JSON
        const parsedResponse = JSON.parse(text);
        return parsedResponse;
      } catch (e) {
        // If parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e2) {
            // If that fails too, return the raw text with a default structure
            return {
              score: 'N/A',
              feedback: text,
              improvement_areas: 'No structured improvement areas available'
            };
          }
        } else {
          // If no JSON pattern found, return the raw text
          return {
            score: 'N/A',
            feedback: text,
            improvement_areas: 'No structured improvement areas available'
          };
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        error: 'Failed to evaluate answer',
        details: error.message
      };
    }
  }
}
