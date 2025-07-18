import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { EmailService } from './common/services/email.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get application status' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
  }

  @Get('debug')
  @ApiOperation({ summary: 'Debug information (development only)' })
  getDebug() {
    if (process.env.NODE_ENV === 'production') {
      return { message: 'Debug endpoint disabled in production' };
    }
    
    return {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        type: 'sqlite',
        file: 'prepmate.sqlite'
      },
      cors: {
        enabled: true,
        origins: process.env.CORS_ORIGIN || 'multiple origins configured'
      },
      jwt: {
        secret: process.env.JWT_SECRET ? 'configured' : 'using default'
      }
    };
  }

  @Get('sw.js')
  @ApiOperation({ summary: 'Service worker file (returns empty response)' })
  getServiceWorker(@Res() res: Response) {
    // Return an empty service worker to prevent 404 errors
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(HttpStatus.OK).send('// Empty service worker file');
  }

  @Get('email-test-info')
  @ApiOperation({ summary: 'Get email test account information (development only)' })
  getEmailTestInfo() {
    if (process.env.NODE_ENV === 'production') {
      return { 
        message: 'Email test information is only available in development mode',
        isTestMode: false
      };
    }

    const credentials = this.emailService.getTestAccountCredentials();
    const isUsingTestAccount = this.emailService.isUsingTestAccount();

    if (!isUsingTestAccount || !credentials) {
      return {
        message: 'Using real email configuration',
        isTestMode: false,
        etherealEmail: null
      };
    }

    return {
      message: 'Using Ethereal Email for testing',
      isTestMode: true,
      etherealEmail: {
        email: credentials.user,
        password: credentials.pass,
        loginUrl: 'https://ethereal.email',
        instructions: 'Use the email and password above to login to Ethereal Email and view test emails'
      }
    };
  }
}
