import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async list(departement?: string, role?: string, actif?: boolean) {
    const where: any = {};
    if (departement) where.departement = departement;
    if (role) where.role = role;
    if (actif !== undefined) where.actif = actif;

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { dateCreation: 'desc' },
      include: {
        devices: { where: { actif: true }, take: 1 },
        sessions: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    return users.map((u) => this.formatUser(u));
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        devices: true,
        sessions: { orderBy: { date: 'desc' }, take: 50 },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.formatUser(user);
  }

  async create(data: { email: string; password: string; firstName?: string; lastName?: string; prenom?: string; nom?: string; role?: string; departement?: string; telephone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName || data.prenom,
        lastName: data.lastName || data.nom,
        passwordHash,
        role: data.role || 'employe',
        departement: data.departement,
        telephone: data.telephone,
        statutActuel: 'absent',
      },
    });

    // Envoi email d'accueil (ne bloque pas si échoue)
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName || '', data.password);
    } catch (e) {
      // log l'erreur sans faire échouer la création
    }

    return this.formatUser(user);
  }

  async update(id: string, data: { email?: string; firstName?: string; lastName?: string; role?: string; departement?: string; telephone?: string; actif?: boolean; statutActuel?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.departement !== undefined) updateData.departement = data.departement;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.statutActuel !== undefined) updateData.statutActuel = data.statutActuel;

    const updated = await this.prisma.user.update({ where: { id }, data: updateData });
    return this.formatUser(updated);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id }, data: { actif: false } });
    return { deleted: true, id };
  }

  async resetPin(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const codePinHash = await bcrypt.hash(newPin, 10);
    await this.prisma.user.update({ where: { id }, data: { codePinHash } });

    try {
      await this.emailService.sendPasswordResetEmail(user.email, newPin);
    } catch (e) {
      // log sans bloquer
    }

    return { success: true, newPin };
  }

  async debloquerPin(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({
      where: { id },
      data: { tentativesPin: 0, blocagePinJusqua: null },
    });
    return { success: true };
  }

  async getDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        devices: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const sessions = await this.prisma.sessionPresence.findMany({
      where: { userId: id },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const anomalies = await this.prisma.anomaly.findMany({
      where: { userId: id },
      orderBy: { dateDetection: 'desc' },
    });

    // Générer calendrier (30 derniers jours)
    const calendrier: any[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const daySessions = sessions.filter(
        (s) =>
          `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}-${String(s.date.getDate()).padStart(2, '0')}` === dateStr,
      );
      let statut = 'absent';
      if (daySessions.length > 0) {
        const hasDepart = daySessions.some((s) => s.heureDepart);
        if (hasDepart) statut = 'present';
        else statut = daySessions.some((s) => (s.retardMinutes ?? 0) > 10) ? 'retard' : 'present';
      }
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) statut = 'weekend';
      calendrier.push({ date: dateStr, statut, sessions: daySessions.map((s) => this.formatSession(s)) });
    }

    return {
      utilisateur: this.formatUser(user),
      calendrier,
      sessions: sessions.map((s) => this.formatSession(s)),
      anomalies: anomalies.map((a: any) => ({
        id: a.id,
        user_id: a.userId,
        type: a.type,
        description: a.description,
        date_detection: a.dateDetection.toISOString(),
        traitee: a.traitee,
        geoloc_verifiee: a.geolocVerifiee,
      })),
    };
  }

  async toggleAccount(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { actif: !user.actif },
    });
    return { success: true, actif: updated.actif };
  }

  private formatSession(s: any) {
    return {
      id: s.id,
      date: s.date.toISOString(),
      heure_arrivee: s.heureArrivee.toISOString(),
      heure_depart: s.heureDepart?.toISOString() || null,
      type_arrivee: s.typeArrivee,
      methode_validation: s.methodeValidation,
      valide: s.valide,
      retard_minutes: s.retardMinutes || 0,
      latitude: s.latitude || null,
      longitude: s.longitude || null,
    };
  }

  private formatUser(u: any) {
    return {
      id: u.id,
      nom: u.lastName || '',
      prenom: u.firstName || '',
      email: u.email,
      role: u.role,
      statut_actuel: u.statutActuel || 'absent',
      departement: u.departement || '',
      photo_url: u.photoUrl || null,
      actif: u.actif,
      tentatives_pin: u.tentativesPin ?? 0,
      blocage_pin_jusqua: u.blocagePinJusqua?.toISOString() || null,
      date_creation: u.dateCreation.toISOString(),
      telephone: u.telephone || null,
      appareil: u.devices?.[0] ? {
        id: u.devices[0].id,
        identifiant_appareil: u.devices[0].identifiantAppareil,
        marque: u.devices[0].marque,
        modele: u.devices[0].modele,
        actif: u.devices[0].actif,
      } : null,
    };
  }
}
