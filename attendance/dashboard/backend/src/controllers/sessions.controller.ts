import { Body, Controller, Get, Param, Post, Put, Delete, Query, ForbiddenException } from '@nestjs/common';
import { SessionsService } from '../services/sessions.service';
import { LogsService } from '../services/logs.service';
import { CheckinDto } from '../dto/checkin.dto';
import { CheckoutDto } from '../dto/checkout.dto';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { User } from '../auth/user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly logs: LogsService,
  ) {}

  @Public()
  @Post('checkin')
  async checkin(@Body() body: CheckinDto) {
    return this.sessions.checkin(
      body.userId,
      body.deviceId,
      body.method || 'pin',
      body.latitude,
      body.longitude,
      body.bssid,
      body.ipLocale,
      body.estRetourPause,
      body.codePin,
    );
  }

  @Public()
  @Post('checkout')
  async checkout(@Body() body: CheckoutDto) {
    return this.sessions.checkout(body.userId, body.deviceId);
  }

  @Get()
  @Roles('gestionnaire', 'admin')
  async listAll(
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.sessions.listAll(dateFrom, dateTo);
  }

  @Get('active')
  @Roles('gestionnaire', 'admin')
  async getActive() {
    return this.sessions.getActive();
  }

  @Get('stats')
  @Roles('gestionnaire', 'admin')
  async getStats(
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    if (!dateFrom && !dateTo) {
      return this.sessions.getDashboard();
    }
    return this.sessions.getStats(dateFrom, dateTo);
  }

  @Get('stats/monthly')
  @Roles('gestionnaire', 'admin')
  async getMonthlyStats(@Query('year') year?: string) {
    return this.sessions.getMonthlyStats(year ? parseInt(year) : undefined);
  }

  @Get('stats/monthly/employees')
  @Roles('gestionnaire', 'admin')
  async getMonthlyEmployeeStats(@Query('year') year?: string, @Query('month') month?: string) {
    return this.sessions.getMonthlyEmployeeStats(
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Post('detect-pauses')
  @Roles('gestionnaire', 'admin')
  async detecterPausesDepassees(@User() user: any) {
    const results = await this.sessions.detecterPausesDepassees();
    if (results.length > 0) {
      await this.logs.create({
        auteurId: user.userId,
        action: 'detection_pauses',
        cibleId: user.userId,
        details: `${results.length} employé(s) passé(s) en absent automatique`,
      });
    }
    return { traites: results.length, details: results };
  }

  @Get('today')
  @Roles('gestionnaire', 'admin')
  async getToday() {
    return this.sessions.getTodaySessions();
  }

  @Get(':userId')
  async list(@Param('userId') userId: string, @User() user: any) {
    // Employé ne peut voir que ses propres sessions
    if (user.role === 'employe' && user.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres sessions');
    }
    return this.sessions.list(userId);
  }

  @Put(':id')
  @Roles('gestionnaire', 'admin')
  async update(
    @Param('id') id: string,
    @Body() body: { heureArrivee?: string; heureDepart?: string; valide?: boolean; retardMinutes?: number },
    @User() user: any,
  ) {
    const result = await this.sessions.updateSession(id, body);
    await this.logs.create({
      auteurId: user.userId,
      action: 'modification_session',
      cibleId: id,
      details: JSON.stringify(body),
    });
    return result;
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @User() user: any) {
    const result = await this.sessions.deleteSession(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'suppression_session',
      cibleId: id,
    });
    return result;
  }
}
