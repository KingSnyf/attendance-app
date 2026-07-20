import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import * as express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/http-exception.filter';

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
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cookieParser());
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const uploadPath = join(process.cwd(), 'uploads');
  app.use('/uploads', (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.access_token;
    if (!token) throw new UnauthorizedException('Authentification requise');
    try { jwt.verify(token, process.env.JWT_SECRET || ''); next(); }
    catch { throw new UnauthorizedException('Token invalide'); }
  }, express.static(uploadPath));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`Attendance backend listening on http://localhost:${port}`);
}

bootstrap();
