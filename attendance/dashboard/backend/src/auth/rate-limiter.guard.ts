import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private store = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const key = `${ip}:${request.route?.path || request.url}`;

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    entry.count++;
    if (entry.count > 20) {
      // Max 20 requêtes par minute par IP
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
