import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard } from './auth/rate-limiter.guard';
import { SessionsController } from './controllers/sessions.controller';
import { SettingsController } from './controllers/settings.controller';
import { AnomaliesController } from './controllers/anomalies.controller';
import { UsersController } from './controllers/users.controller';
import { DevicesController } from './controllers/devices.controller';
import { ExportController } from './controllers/export.controller';
import { SessionsService } from './services/sessions.service';
import { SettingsService } from './services/settings.service';
import { AnomaliesService } from './services/anomalies.service';
import { UsersService } from './services/users.service';
import { LogsService } from './services/logs.service';
import { DevicesService } from './services/devices.service';
import { EmailService } from './services/email.service';
import { SchedulerService } from './services/scheduler.service';
import { ModificationsModule } from './modules/modifications.module';
import { LogsModule } from './modules/logs.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, ModificationsModule, LogsModule],
  controllers: [
    SessionsController,
    SettingsController,
    AnomaliesController,
    UsersController,
    DevicesController,
    ExportController,
  ],
  providers: [
    PrismaService,
    SessionsService,
    SettingsService,
    AnomaliesService,
    UsersService,
    LogsService,
    DevicesService,
    EmailService,
    SchedulerService,
    { provide: APP_GUARD, useClass: RateLimiterGuard },
  ],
})
export class AppModule {}
