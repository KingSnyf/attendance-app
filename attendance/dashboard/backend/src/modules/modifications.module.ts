import { Module } from '@nestjs/common';
import { ModificationsController } from '../controllers/modifications.controller';
import { ModificationsService } from '../services/modifications.service';
import { LogsService } from '../services/logs.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ModificationsController],
  providers: [ModificationsService, LogsService, PrismaService],
  exports: [ModificationsService],
})
export class ModificationsModule {}
