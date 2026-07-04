import { Body, Controller, Get, Param, Post, Put, Patch, Delete, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { DevicesService } from '../services/devices.service';
import { LogsService } from '../services/logs.service';
import { AnomaliesService } from '../services/anomalies.service';
import { SessionsService } from '../services/sessions.service';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../auth/user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly devices: DevicesService,
    private readonly anomalies: AnomaliesService,
    private readonly sessions: SessionsService,
    private readonly logs: LogsService,
  ) {}

  @Get()
  @Roles('gestionnaire', 'admin')
  async list(
    @Query('departement') departement?: string,
    @Query('role') role?: string,
    @Query('actif') actif?: string,
  ) {
    const actifBool = actif === 'true' ? true : actif === 'false' ? false : undefined;
    return this.users.list(departement, role, actifBool);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @User() user: any) {
    if (user.role === 'employe' && user.userId !== id) {
      throw new ForbiddenException('Vous ne pouvez consulter que votre propre profil');
    }
    return this.users.getDetail(id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() payload: CreateUserDto, @User() user: any) {
    const result = await this.users.create(payload);
    await this.logs.create({
      auteurId: user.userId,
      action: 'creation_utilisateur',
      cibleId: result.id,
      details: `Création de l'utilisateur ${payload.email}`,
    });
    return result;
  }

  @Put(':id')
  @Roles('gestionnaire', 'admin')
  async update(@Param('id') id: string, @Body() payload: UpdateUserDto, @User() user: any) {
    const result = await this.users.update(id, payload);
    await this.logs.create({
      auteurId: user.userId,
      action: 'modification_utilisateur',
      cibleId: id,
    });
    return result;
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string, @User() user: any) {
    const result = await this.users.remove(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'desactivation_utilisateur',
      cibleId: id,
    });
    return result;
  }

  @Post(':id/reset-pin')
  @Roles('gestionnaire', 'admin')
  async resetPin(@Param('id') id: string, @User() user: any) {
    const result = await this.users.resetPin(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'reset_pin',
      cibleId: id,
    });
    return result;
  }

  @Post(':id/toggle-active')
  @Roles('gestionnaire', 'admin')
  async toggleAccount(@Param('id') id: string, @User() user: any) {
    const result = await this.users.toggleAccount(id);
    await this.logs.create({
      auteurId: user.userId,
      action: result.actif ? 'activation_utilisateur' : 'desactivation_utilisateur',
      cibleId: id,
    });
    return result;
  }

  @Patch(':id/device/deactivate')
  @Roles('gestionnaire', 'admin')
  async deactivateDevice(@Param('id') id: string, @User() user: any) {
    const result = await this.devices.desassocierByUserId(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'desassociation_appareil',
      cibleId: id,
      details: `Appareil désactivé pour l'utilisateur ${id}`,
    });
    return result;
  }

  @Post(':id/debloquer-pin')
  @Roles('gestionnaire', 'admin')
  async debloquerPin(@Param('id') id: string, @User() user: any) {
    await this.users.debloquerPin(id);
    await this.logs.create({
      auteurId: user.userId,
      action: 'deblocage_pin',
      cibleId: id,
    });
    return { success: true };
  }
}
