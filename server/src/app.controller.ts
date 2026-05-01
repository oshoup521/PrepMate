import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

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
  async getHealth(@Res() res: Response) {
    const db = await this.appService.checkDbHealth();
    const healthy = db.db === 'ok';
    return res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      ...db,
    });
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
        file: 'prepmate.sqlite',
      },
      cors: {
        enabled: true,
        origins: process.env.CORS_ORIGIN || 'multiple origins configured',
      },
      jwt: {
        secret: process.env.JWT_SECRET ? 'configured' : 'using default',
      },
    };
  }

  @Get('sw.js')
  @ApiOperation({ summary: 'Service worker file (returns empty response)' })
  getServiceWorker(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(HttpStatus.OK).send('// Empty service worker file');
  }
}
