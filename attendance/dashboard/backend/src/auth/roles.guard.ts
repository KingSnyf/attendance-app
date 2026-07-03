import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

const HIERARCHIE: Record<string, number> = {
  employe: 0,
  gestionnaire: 1,
  admin: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userLevel = HIERARCHIE[user.role] ?? -1;
    const niveauRequis = Math.min(...requiredRoles.map((r) => HIERARCHIE[r] ?? -1));

    if (userLevel < niveauRequis) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
