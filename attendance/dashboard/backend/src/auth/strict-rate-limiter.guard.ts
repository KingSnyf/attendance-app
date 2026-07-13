import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, OnModuleDestroy } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class StrictRateLimiterGuard implements CanActivate, OnModuleDestroy {
  private store = new Map<string, RateLimitEntry>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupTimer = setInterval(() => this.prune(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  private prune() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) this.store.delete(key);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const key = `${ip}:verify-pin`;

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    entry.count++;
    if (entry.count > 5) {
      throw new HttpException('Trop de tentatives. Réessayez dans une minute.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
