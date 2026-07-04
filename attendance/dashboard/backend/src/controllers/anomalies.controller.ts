import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AnomaliesService } from '../services/anomalies.service';
import { LogsService } from '../services/logs.service';
import { ResolveAnomalyDto } from '../dto/resolve-anomaly.dto';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('anomalies')
export class AnomaliesController {
  constructor(
    private readonly svc: AnomaliesService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @Roles('gestionnaire', 'admin')
  async list(
    @Query('type') type?: string,
    @Query('traitee') traitee?: string,
  ) {
    const traiteeBool = traitee === 'true' ? true : traitee === 'false' ? false : undefined;
    return this.svc.list(type, traiteeBool);
  }

  @Post(':id/resolve')
  @Roles('gestionnaire', 'admin')
  async resolve(
    @Param('id') id: string,
    @Body() body: ResolveAnomalyDto,
    @User() user: any,
  ) {
    const result = await this.svc.resolve(id, body.comment, body.geoloc_verifiee);
    await this.logs.create({
      auteurId: user.userId,
      action: 'validation_anomalie',
      cibleId: id,
      details: body.comment || 'Anomalie traitée',
    });
    return result;
  }
}
