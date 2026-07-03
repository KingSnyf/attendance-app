import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;

    const devices = await this.prisma.device.findMany({
      where,
      orderBy: { dateAssociation: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return devices.map((d) => ({
      id: d.id,
      user_id: d.userId,
      identifiant_appareil: d.identifiantAppareil,
      modele: d.modele,
      date_association: d.dateAssociation.toISOString(),
      actif: d.actif,
      employe: d.user ? { nom: d.user.lastName, prenom: d.user.firstName, email: d.user.email } : null,
    }));
  }

  async getById(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!device) throw new NotFoundException('Device not found');

    return {
      id: device.id,
      user_id: device.userId,
      identifiant_appareil: device.identifiantAppareil,
      modele: device.modele,
      date_association: device.dateAssociation.toISOString(),
      actif: device.actif,
      employe: device.user ? { nom: device.user.lastName, prenom: device.user.firstName, email: device.user.email } : null,
    };
  }

  async associate(userId: string, identifiantAppareil: string, modele?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Désactiver l'ancien appareil actif
    const ancien = await this.prisma.device.findFirst({ where: { userId, actif: true } });
    if (ancien) {
      await this.prisma.device.update({ where: { id: ancien.id }, data: { actif: false } });
    }

    // Vérifier si cet appareil est déjà associé à un autre employé
    const existing = await this.prisma.device.findFirst({
      where: { identifiantAppareil, actif: true, userId: { not: userId } },
    });
    if (existing) {
      throw new ConflictException('Cet appareil est déjà associé à un autre employé');
    }

    const device = await this.prisma.device.create({
      data: {
        userId,
        identifiantAppareil,
        modele: modele ?? null,
        dateAssociation: new Date(),
        actif: true,
      },
    });

    return {
      id: device.id,
      user_id: device.userId,
      identifiant_appareil: device.identifiantAppareil,
      modele: device.modele,
      date_association: device.dateAssociation.toISOString(),
      actif: device.actif,
    };
  }

  async desassocier(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    await this.prisma.device.update({ where: { id }, data: { actif: false } });
    return { success: true, id };
  }

  async markLost(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    await this.prisma.device.update({ where: { id }, data: { actif: false } });

    await this.prisma.anomaly.create({
      data: {
        userId: device.userId,
        type: 'device_perdu',
        description: `Appareil marqué comme perdu/volé: ${device.identifiantAppareil} (${device.modele || 'modèle inconnu'})`,
        dateDetection: new Date(),
        traitee: false,
      },
    });

    return { success: true, id, perte_signalee: true };
  }
}
