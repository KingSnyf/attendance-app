import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { JwtModule } from '@nestjs/jwt';

function validateEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET === 'dev-secret') {
    console.warn('⚠️  JWT_SECRET est "dev-secret" — changez-le en production.');
  }
  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = 'http://localhost:3000';
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const uploadPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadPath));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`Attendance backend listening on http://localhost:${port}`);
}

bootstrap();
