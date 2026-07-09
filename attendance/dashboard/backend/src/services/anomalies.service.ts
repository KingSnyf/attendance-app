import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../gateways/events.gateway';

const POIDS_PAR_TYPE: Record<string, number> = {
  geofencing_incoherent: 0.85,
  device_different: 0.70,
  device_inconnu: 0.70,
  hors_reseau: 0.60,
  pause_depassee: 0.50,
  retard: 0.25,
};

export function calculerScore(type: string, dateDetection: Date, traitee: boolean): number {
  const base = POIDS_PAR_TYPE[type] ?? 0.30;
  if (traitee) return Math.min(base, 0.40);
  const heures = (Date.now() - dateDetection.getTime()) / 3_600_000;
  const majoration = Math.min(Math.floor(heures / 24) * 0.10, 1.0 - base);
  return Math.min(base + majoration, 1.0);
}

export function niveauCriticite(score: number): string {
  if (score >= 0.7) return 'critique';
  if (score >= 0.4) return 'moyen';
  return 'faible';
}

@Injectable()
export class AnomaliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async list(type?: string, traitee?: boolean) {
    const where: any = {};
    if (type && type !== 'all') where.type = type;
    if (traitee !== undefined) where.traitee = traitee;

    const anomalies = await this.prisma.anomaly.findMany({
      where,
      orderBy: { dateDetection: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    }) as any[];

    const mapped = anomalies.map((a: any) => {
      const score = calculerScore(a.type, a.dateDetection, a.traitee);
      return {
        id: a.id,
        user_id: a.userId,
        type: a.type,
        description: a.description,
        date_detection: a.dateDetection.toISOString(),
        traitee: a.traitee,
        commentaire: a.commentaire,
        geoloc_verifiee: a.geolocVerifiee,
        score: Math.round(score * 100) / 100,
        criticite: niveauCriticite(score),
        employe: a.user ? { nom: a.user.lastName, prenom: a.user.firstName } : null,
      };
    });

    mapped.sort((a, b) => b.score - a.score);
    return mapped;
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
    this.events.emitAnomalieCreee(anomaly);
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