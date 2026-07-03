import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from '../services/logs.service';
import { Roles } from '../auth/roles.decorator';

@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Get()
  @Roles('admin')
  async list(
    @Query('auteur_id') auteurId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.logs.list(auteurId, action, from, to);
  }
}
