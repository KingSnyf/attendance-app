import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ModificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(statut?: string) {
    const where: any = {};
    if (statut && statut !== 'all') where.statut = statut;

    const requests = await this.prisma.requestModification.findMany({
      where,
      orderBy: { dateDemande: 'desc' },
      include: {
        session: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }) as any[];

    return requests.map((r: any) => ({
      id: r.id,
      gestionnaire_id: r.gestionnaireId,
      session_presence_id: r.sessionPresenceId,
      modification_proposee: r.modificationProposee,
      raison: r.raison,
      statut: r.statut,
      admin_id: r.adminId,
      date_demande: r.dateDemande.toISOString(),
      date_traitement: r.dateTraitement?.toISOString() ?? null,
      session: r.session ? {
        id: r.session.id,
        user_id: r.session.userId,
        date: r.session.date.toISOString().slice(0, 10),
        heure_arrivee: r.session.heureArrivee.toISOString(),
        heure_depart: r.session.heureDepart?.toISOString() ?? null,
      } : null,
      employe: r.session?.user ? {
        id: r.session.user.id,
        nom: r.session.user.lastName || '',
        prenom: r.session.user.firstName || '',
      } : null,
    }));
  }

  async create(data: { gestionnaireId: string; sessionPresenceId: string; modificationProposee: string; raison: string }) {
    const session = await this.prisma.sessionPresence.findUnique({ where: { id: data.sessionPresenceId } });
    if (!session) throw new NotFoundException('Session not found');

    const request = await this.prisma.requestModification.create({
      data: {
        gestionnaireId: data.gestionnaireId,
        sessionPresenceId: data.sessionPresenceId,
        modificationProposee: data.modificationProposee,
        raison: data.raison,
        statut: 'en_attente',
        dateDemande: new Date(),
      },
    });

    return {
      id: request.id,
      gestionnaire_id: request.gestionnaireId,
      session_presence_id: request.sessionPresenceId,
      modification_proposee: request.modificationProposee,
      raison: request.raison,
      statut: request.statut,
      date_demande: request.dateDemande.toISOString(),
    };
  }

  async process(id: string, statut: string, adminId: string) {
    const request = await this.prisma.requestModification.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Modification request not found');

    const updated = await this.prisma.requestModification.update({
      where: { id },
      data: {
        statut,
        adminId,
        dateTraitement: new Date(),
      },
    });

    return {
      id: updated.id,
      statut: updated.statut,
      admin_id: updated.adminId,
      date_traitement: updated.dateTraitement?.toISOString(),
    };
  }
}
