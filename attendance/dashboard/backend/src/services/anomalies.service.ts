import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnomaliesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type?: string, traitee?: boolean) {
    const where: any = {};
    if (type && type !== 'all') where.type = type;
    if (traitee !== undefined) where.traitee = traitee;

    const anomalies = await this.prisma.anomaly.findMany({
      where,
      orderBy: { dateDetection: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    }) as any[];

    return anomalies.map((a: any) => ({
      id: a.id,
      user_id: a.userId,
      type: a.type,
      description: a.description,
      date_detection: a.dateDetection.toISOString(),
      traitee: a.traitee,
      commentaire: a.commentaire,
      geoloc_verifiee: a.geolocVerifiee,
      employe: a.user ? { nom: a.user.lastName, prenom: a.user.firstName } : null,
    }));
  }

  async resolve(id: string, commentaire?: string, geolocVerifiee?: boolean) {
    const anomaly = await this.prisma.anomaly.findUnique({ where: { id } });
    if (!anomaly) throw new NotFoundException('Anomaly not found');

    const updated = await this.prisma.anomaly.update({
      where: { id },
      data: {
        traitee: true,
        commentaire: commentaire ?? null,
        geolocVerifiee: geolocVerifiee ?? false,
      },
    });
    return {
      id: updated.id,
      traitee: updated.traitee,
      commentaire: updated.commentaire,
      geoloc_verifiee: updated.geolocVerifiee,
    };
  }

  async create(data: { userId?: string; type: string; description?: string }) {
    const anomaly = await this.prisma.anomaly.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description,
        dateDetection: new Date(),
        traitee: false,
      },
    });
    return {
      id: anomaly.id,
      user_id: anomaly.userId,
      type: anomaly.type,
      description: anomaly.description,
      date_detection: anomaly.dateDetection.toISOString(),
      traitee: anomaly.traitee,
    };
  }
}
