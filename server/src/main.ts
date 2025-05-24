import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Get CORS origin from environment or use multiple origins
  const corsOrigin = configService.get('CORS_ORIGIN');
  const origins = corsOrigin ? 
    [corsOrigin, 'http://localhost:5173'] : 
    ['https://prepmate-ucro.onrender.com', 'http://localhost:5173'];
  
  // Enable CORS for the frontend
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
