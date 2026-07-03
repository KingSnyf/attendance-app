import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModificationsService } from '../services/modifications.service';
import { LogsService } from '../services/logs.service';
import { CreateModificationDto } from '../dto/create-modification.dto';
import { ProcessModificationDto } from '../dto/process-modification.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../auth/user.decorator';

@Controller('modifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ModificationsController {
  constructor(
    private readonly modifications: ModificationsService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @Roles('gestionnaire', 'admin')
  async list(@Query('statut') statut?: string) {
    return this.modifications.list(statut);
  }

  @Post()
  @Roles('gestionnaire', 'admin')
  async create(@Body() body: CreateModificationDto, @User() user: any) {
    const result = await this.modifications.create(body);
    await this.logs.create({
      auteurId: user.userId,
      action: 'creation_demande',
      cibleId: result.id,
    });
    return result;
  }

  @Put(':id/process')
  @Roles('gestionnaire', 'admin')
  async process(
    @Param('id') id: string,
    @Body() body: ProcessModificationDto,
    @User() user: any,
  ) {
    const result = await this.modifications.process(id, body.statut, body.adminId);
    await this.logs.create({
      auteurId: user.userId,
      action: `modification_${body.statut}`,
      cibleId: id,
      details: `Demande ${body.statut}`,
    });
    return result;
  }
}
