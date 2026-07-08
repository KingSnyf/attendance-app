import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma.service';

@Controller('search')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SearchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('gestionnaire', 'admin')
  async search(@Query('q') q?: string) {
    if (!q || q.length < 2) return { employes: [], anomalies: [], logs: [] };

    const employes = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, departement: true, photoUrl: true },
      take: 10,
    });

    const anomalies = await this.prisma.anomaly.findMany({
      where: {
        OR: [
          { type: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      take: 10,
      orderBy: { dateDetection: 'desc' },
    });

    const logs = await this.prisma.logAction.findMany({
      where: {
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { details: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { date: 'desc' },
    }) as any[];

    return {
      employes: employes.map((u: any) => ({ id: u.id, nom: u.lastName, prenom: u.firstName, email: u.email, role: u.role, departement: u.departement, photo_url: u.photoUrl })),
      anomalies: anomalies.map((a: any) => ({ id: a.id, type: a.type, description: a.description, date_detection: a.dateDetection.toISOString(), employe: a.user ? `${a.user.firstName} ${a.user.lastName}` : null })),
      logs: logs.map((l: any) => ({ id: l.id, action: l.action, details: l.details, date: l.date.toISOString() })),
    };
  }
}
