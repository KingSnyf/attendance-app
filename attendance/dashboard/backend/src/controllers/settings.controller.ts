import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { LogsService } from '../services/logs.service';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  async get() {
    return this.settings.getAll();
  }

  @Put()
  @Roles('admin')
  async update(@Body() payload: any, @User() user: any) {
    const result = await this.settings.update(payload);
    await this.logs.create({
      auteurId: user.userId,
      action: 'modification_parametres',
      cibleId: 'system',
      details: 'Paramètres système mis à jour',
    });
    return result;
  }
}
