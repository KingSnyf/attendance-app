import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(auteurId?: string, action?: string, from?: string, to?: string) {
    const where: any = {};
    if (auteurId && auteurId !== 'all') where.auteurId = auteurId;
    if (action && action !== 'all') where.action = action;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const logs = await this.prisma.logAction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 200,
      include: {
        auteur: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }) as any[];

    return logs.map((l: any) => ({
      id: l.id,
      auteur_id: l.auteurId,
      action: l.action,
      cible: l.cibleId,
      details: l.details,
      date: l.date.toISOString(),
      type_action: this.getActionType(l.action),
      auteur: l.auteur ? `${l.auteur.firstName || ''} ${l.auteur.lastName || ''}`.trim() || l.auteur.email : 'Inconnu',
    }));
  }

  async create(data: { auteurId: string; action: string; cibleId: string; details?: string }) {
    const log = await this.prisma.logAction.create({
      data: {
        auteurId: data.auteurId,
        action: data.action,
        cibleId: data.cibleId,
        details: data.details,
        date: new Date(),
      },
    });
    return {
      id: log.id,
      auteur_id: log.auteurId,
      action: log.action,
      cible: log.cibleId,
      details: log.details,
      date: log.date.toISOString(),
    };
  }

  private getActionType(action: string): string {
    if (action.startsWith('creation_')) return 'creation';
    if (action.startsWith('modification_')) return 'modification';
    if (action.startsWith('validation_') || action.startsWith('rejet_')) return 'validation';
    if (action.startsWith('connexion_') || action.startsWith('deconnexion_')) return 'securite';
    if (action.startsWith('export_')) return 'export';
    return 'modification';
  }
}
