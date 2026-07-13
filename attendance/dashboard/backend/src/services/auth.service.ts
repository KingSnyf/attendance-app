import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';
import { genererMotDePasseTemporaire } from '../utils/password.util';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly emailService: EmailService) {}

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
        photo_url: user.photoUrl || null,
      },
    };
  }

  async register(payload: { email: string; password?: string; firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string; telephone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const motDePasseTemporaire = genererMotDePasseTemporaire();
    const pinInitial = Math.floor(1000 + Math.random() * 9000).toString();
    const passwordHash = await bcrypt.hash(motDePasseTemporaire, 10);
    const codePinHash = await bcrypt.hash(pinInitial, 10);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        firstName: payload.firstName || payload.prenom,
        lastName: payload.lastName || payload.nom,
        passwordHash,
        codePinHash,
        methodeAuth: 'pin',
        role: 'employe',
        telephone: payload.telephone,
      }
    });

    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName || '', motDePasseTemporaire, pinInitial);
    } catch (e) {
      // L'envoi d'email ne doit pas faire échouer la création du compte
    }

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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true };

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'reset-password' },
      { expiresIn: '15m' },
    );
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    await this.emailService.sendPasswordResetEmail(email, resetLink);

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Token invalide ou expiré');
    }
    if (payload.purpose !== 'reset-password') {
      throw new BadRequestException('Token invalide');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash: hash } });
    return { success: true };
  }
}