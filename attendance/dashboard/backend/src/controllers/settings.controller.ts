import { Body, Controller, Get, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { LogsService } from '../services/logs.service';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { User } from '../auth/user.decorator';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly logs: LogsService,
  ) {}

  @Public()
  @Get('privacy')
  async getPrivacy() {
    return this.settings.getPrivacy();
  }

  @Get()
  async get() {
    return this.settings.getAll();
  }

  @Put()
  @Roles('admin')
  async update(@Body() payload: UpdateSettingsDto, @User() user: any) {
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
