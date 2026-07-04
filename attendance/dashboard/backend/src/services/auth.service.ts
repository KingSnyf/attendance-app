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
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        prenom: user.firstName || '',
        nom: user.lastName || '',
      },
    };
  }

  async register(payload: { email: string; password: string; firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.firstName || payload.prenom,
        lastName: payload.lastName || payload.nom,
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        devices: { where: { actif: true }, take: 1 },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      prenom: user.firstName || '',
      nom: user.lastName || '',
      role: user.role,
      statut_actuel: user.statutActuel || 'absent',
      departement: user.departement || '',
      actif: user.actif,
      photo_url: user.photoUrl || null,
      appareil: user.devices?.[0]
        ? {
            id: user.devices[0].id,
            identifiant_appareil: user.devices[0].identifiantAppareil,
            modele: user.devices[0].modele,
            actif: user.devices[0].actif,
          }
        : null,
    };
  }

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { dateCreation: 'desc' },
      include: {
        devices: { where: { actif: true }, take: 1 },
        sessions: { orderBy: { date: 'desc' }, take: 1 },
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
      photo_url: u.photoUrl || null,
      date_creation: u.dateCreation.toISOString(),
      appareil: u.devices?.[0]
        ? {
            id: u.devices[0].id,
            identifiant_appareil: u.devices[0].identifiantAppareil,
            modele: u.devices[0].modele,
            actif: u.devices[0].actif,
          }
        : null,
    }));
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string; photoUrl?: string; email?: string }) {
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.email !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) throw new ConflictException('Email already in use');
      updateData.email = data.email;
    }

    const user = await this.prisma.user.update({ where: { id }, data: updateData });
    return {
      id: user.id,
      email: user.email,
      prenom: user.firstName || '',
      nom: user.lastName || '',
      role: user.role,
      statut_actuel: user.statutActuel || 'absent',
      departement: user.departement || '',
      actif: user.actif,
      photo_url: user.photoUrl || null,
    };
  }
}
