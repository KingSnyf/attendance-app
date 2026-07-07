import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../services/logs.service';

@Controller('requests')
export class RequestsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogsService,
  ) {}

  @Post()
  async create(@Body() body: { type: string; dateDebut?: string; dateFin?: string; motif: string }, @User() user: any) {
    return this.prisma.request.create({
      data: {
        userId: user.userId,
        type: body.type || 'absence',
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : null,
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        motif: body.motif,
        statut: 'en_attente',
      },
    });
  }

  @Get()
  @Roles('gestionnaire', 'admin')
  async list(@User() user: any) {
    const where: any = {};
    if (user.role === 'gestionnaire') where.statut = 'en_attente';
    return this.prisma.request.findMany({
      where,
      orderBy: { dateDemande: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, photoUrl: true, departement: true } } },
    });
  }

  @Get('pending')
  @Roles('gestionnaire', 'admin')
  async pendingCount() {
    const count = await this.prisma.request.count({ where: { statut: 'en_attente' } });
    return { count };
  }

  @Post(':id/process')
  @Roles('gestionnaire', 'admin')
  async process(@Param('id') id: string, @Body() body: { action: string; commentaire?: string }, @User() user: any) {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) throw new Error('Demande introuvable');
    if (request.statut !== 'en_attente') throw new Error('Déjà traitée');

    const statut = body.action === 'approve' ? 'approuve' : 'refuse';
    const updated = await this.prisma.request.update({
      where: { id },
      data: { statut, traiteePar: user.userId, dateTraitement: new Date(), commentaire: body.commentaire },
    });

    await this.logs.create({
      auteurId: user.userId,
      action: `demande_${statut}`,
      cibleId: id,
      details: `Demande ${statut} (${request.type}) pour ${request.userId}`,
    });

    return updated;
  }
}
