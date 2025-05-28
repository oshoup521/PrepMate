import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as mongoSanitize from 'express-mongo-sanitize';
import * as hpp from 'hpp';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Create a custom wrapper for mongo sanitize that doesn't try to modify request properties
      if (req.body) {
        // Create a sanitized copy of the body
        const sanitizedBody = JSON.parse(JSON.stringify(req.body));
        req.body = mongoSanitize.sanitize(sanitizedBody, { replaceWith: '_' });
      }
      
      // Use a try/catch block for HPP since it might also try to modify read-only properties
      try {
        hpp()(req, res, () => {
          this.sanitizeInput(req);
          next();
        });
      } catch (hppError) {
        console.error('HPP middleware error:', hppError);
        this.sanitizeInput(req);
        next();
      }
    } catch (error) {
      console.error('Security middleware error:', error);
      next();
    }
  }
  private sanitizeInput(req: Request) {
    // Safely handle query parameters without directly modifying the req.query object
    // Instead of modifying the query params directly, we'll just sanitize what we use from it
    
    // Remove potentially dangerous characters from request body
    if (req.body && typeof req.body === 'object') {
      this.cleanObject(req.body);
    }
  }

  private cleanInput(input: string): string {
    // Remove or escape potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"]/g, '') // Remove basic HTML/JS characters
      .trim();
  }

  private cleanObject(obj: any) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = this.cleanInput(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.cleanObject(obj[key]);
      }
    });
  }
}
