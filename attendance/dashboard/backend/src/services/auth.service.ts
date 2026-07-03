import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  async register(payload: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        passwordHash,
        methodeAuth: 'pin',
        role: payload.role || 'employe'
      }
    });

    // Récupérer la politique de confidentialité pour la retourner
    let politique = '';
    try {
      const settings = await this.prisma.setting.findFirst();
      politique = settings?.politiqueConfidentialite || '';
    } catch {}

    return { ok: true, user: { id: user.id, email: user.email, role: user.role }, politiqueConfidentialite: politique };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      statutActuel: user.statutActuel,
      departement: user.departement,
      actif: user.actif,
    };
  }

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { dateCreation: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        statutActuel: true,
        departement: true,
        actif: true,
        dateCreation: true,
      },
    });
    return users.map((u) => ({
      id: u.id,
      nom: u.lastName || '',
      prenom: u.firstName || '',
      email: u.email,
      role: u.role,
      statut_actuel: u.statutActuel || 'absent',
      departement: u.departement || '',
      actif: u.actif,
      date_creation: u.dateCreation.toISOString(),
    }));
  }
}
