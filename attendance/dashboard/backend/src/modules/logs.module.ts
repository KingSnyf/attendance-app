import { Module } from '@nestjs/common';
import { LogsController } from '../controllers/logs.controller';
import { LogsService } from '../services/logs.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LogsController],
  providers: [LogsService, PrismaService],
  exports: [LogsService],
})
export class LogsModule {}
