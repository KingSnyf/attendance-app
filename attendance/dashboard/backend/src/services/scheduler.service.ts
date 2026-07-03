import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private interval: any;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Vérifier les pauses dépassées toutes les 5 minutes
    this.interval = setInterval(() => this.detecterPausesDepassees(), 5 * 60 * 1000);
    this.logger.log('Scheduler démarré — détection pauses dépassées toutes les 5 min');
  }

  private async detecterPausesDepassees() {
    try {
      const settings = await this.prisma.setting.findFirst();
      const maxPause = settings?.dureePauseMaxMinutes ?? 90;
      const now = new Date();

      const enPause = await this.prisma.user.findMany({
        where: { statutActuel: 'en_attente' },
      });

      for (const user of enPause) {
        const derniereSession = await this.prisma.sessionPresence.findFirst({
          where: { userId: user.id, heureDepart: { not: null } },
          orderBy: { heureDepart: 'desc' },
        });

        if (derniereSession?.heureDepart) {
          const minutesPause = Math.round((now.getTime() - derniereSession.heureDepart.getTime()) / 60000);
          if (minutesPause > maxPause) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { statutActuel: 'absent' },
            });

            await this.prisma.anomaly.create({
              data: {
                userId: user.id,
                type: 'pause_depassee',
                description: `[Auto] Pause dépassée: ${minutesPause}min (max: ${maxPause}min) — passage en absent automatique`,
                dateDetection: now,
                traitee: false,
              },
            });

            this.logger.log(`Employé ${user.email} passé en absent (pause ${minutesPause}min > ${maxPause}min)`);
          }
        }
      }
    } catch (e) {
      this.logger.error('Erreur détection pauses:', (e as Error).message);
    }
  }
}
