import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { DevicesService } from '../services/devices.service';
import { LogsService } from '../services/logs.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devices: DevicesService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @Roles('gestionnaire', 'admin')
  async list(@Query('user_id') userId?: string) {
    return this.devices.list(userId);
  }

  @Get(':id')
  @Roles('gestionnaire', 'admin')
  async getById(@Param('id') id: string) {
    return this.devices.getById(id);
  }

  @Post('associate')
  @Roles('gestionnaire', 'admin')
  async associate(@Body() body: CreateDeviceDto, @User() user: any) {
    const result = await this.devices.associate(body.userId, body.identifiantAppareil, body.modele);
    await this.logs.create({
      auteurId: user.userId,
      action: 'association_appareil',
      cibleId: body.userId,
      details: `Appareil ${body.identifiantAppareil} associé à l'utilisateur`,
    });
    return result;
  }

  @Put(':id/desassocier')
  @Roles('gestionnaire', 'admin')
  async desassocier(@Param('id') id: string, @User() user: any) {
    const result = await this.devices.desassocier(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'desassociation_appareil',
      cibleId: id,
    });
    return result;
  }

  @Put(':id/perte')
  @Roles('gestionnaire', 'admin')
  async markLost(@Param('id') id: string, @User() user: any) {
    const result = await this.devices.markLost(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'perte_appareil',
      cibleId: id,
    });
    return result;
  }
}
