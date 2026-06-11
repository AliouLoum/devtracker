import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
dotenvConfig({ path: join(process.cwd(), '..', '.env') });
dotenvConfig({ path: join(process.cwd(), '.env') });

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const prefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(prefix, {
    exclude: ['auth/google', 'auth/google/callback'],
  });

  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in case of misconfiguration
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevTracker API')
    .setDescription('Project management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('BACKEND_PORT', 3000);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/${prefix}`);
  console.log(`Swagger: http://localhost:${port}/docs`);
  console.log(`WebSocket: ws://localhost:${port}`);
}

// Start the application
void bootstrap();
