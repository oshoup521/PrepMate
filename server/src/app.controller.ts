import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
