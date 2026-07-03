import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
const ExcelJS = require('exceljs');
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../services/logs.service';
import { User } from '../auth/user.decorator';

@Controller('export')
export class ExportController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: LogsService,
  ) {}

  @Get('sessions/csv')
  @Roles('gestionnaire', 'admin')
  async exportSessionsCsv(
    @User() user: any,
    @Res() res: Response,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('user_id') userId?: string,
  ) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (userId) where.userId = userId;

    const sessions = await this.prisma.sessionPresence.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, departement: true } },
      },
    });

    const headers = [
      'Date',
      'Employé',
      'Email',
      'Département',
      'Arrivée',
      'Départ',
      'Durée (min)',
      'Méthode',
      'Retard (min)',
      'Valide',
      'Heures sup (min)',
    ];

    const rows = sessions.map((s) => {
      let duree = 0;
      let heuresSup = 0;
      if (s.heureDepart) {
        duree = Math.round((s.heureDepart.getTime() - s.heureArrivee.getTime()) / 60000);
        const fin = new Date(s.heureDepart);
        const dixSept = new Date(fin);
        dixSept.setHours(17, 0, 0, 0);
        if (fin > dixSept) {
          heuresSup = Math.round((fin.getTime() - dixSept.getTime()) / 60000);
        }
      }
      return [
        `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}-${String(s.date.getDate()).padStart(2, '0')}`,
        `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        s.user?.email || '',
        s.user?.departement || '',
        s.heureArrivee.toISOString(),
        s.heureDepart ? s.heureDepart.toISOString() : '',
        duree,
        s.methodeValidation,
        s.retardMinutes ?? 0,
        s.valide ? 'Oui' : 'Non',
        heuresSup,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    await this.logs.create({
      auteurId: user.userId,
      action: 'export_sessions_csv',
      cibleId: user.userId,
      details: `Export CSV sessions du ${dateFrom || 'début'} au ${dateTo || 'fin'}`,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Disposition', `attachment; filename="sessions_${todayStr}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Get('anomalies/csv')
  @Roles('gestionnaire', 'admin')
  async exportAnomaliesCsv(
    @User() user: any,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('traitee') traitee?: string,
  ) {
    const where: any = {};
    if (type && type !== 'all') where.type = type;
    if (traitee !== undefined) where.traitee = traitee === 'true';

    const anomalies = await this.prisma.anomaly.findMany({
      where,
      orderBy: { dateDetection: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const headers = ['Date', 'Employé', 'Email', 'Type', 'Description', 'Traitée', 'Commentaire'];
    const rows = anomalies.map((a) => [
      a.dateDetection.toISOString(),
      `${a.user?.firstName || ''} ${a.user?.lastName || ''}`,
      a.user?.email || '',
      a.type,
      a.description || '',
      a.traitee ? 'Oui' : 'Non',
      a.commentaire || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    await this.logs.create({
      auteurId: user.userId,
      action: 'export_anomalies_csv',
      cibleId: user.userId,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Disposition', `attachment; filename="anomalies_${todayStr}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Get('anomalies/excel')
  @Roles('gestionnaire', 'admin')
  async exportAnomaliesExcel(
    @User() user: any,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('traitee') traitee?: string,
  ) {
    const where: any = {};
    if (type && type !== 'all') where.type = type;
    if (traitee !== undefined) where.traitee = traitee === 'true';

    const anomalies = await this.prisma.anomaly.findMany({
      where,
      orderBy: { dateDetection: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Attendance';
    const ws = wb.addWorksheet('Anomalies');

    ws.columns = [
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Employé', key: 'employe', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Traitée', key: 'traitee', width: 10 },
      { header: 'Commentaire', key: 'commentaire', width: 50 },
    ];

    for (const a of anomalies) {
      ws.addRow({
        date: a.dateDetection.toISOString(),
        employe: `${a.user?.firstName || ''} ${a.user?.lastName || ''}`,
        email: a.user?.email || '',
        type: a.type,
        description: a.description || '',
        traitee: a.traitee ? 'Oui' : 'Non',
        commentaire: a.commentaire || '',
      });
    }

    ws.getRow(1).font = { bold: true };

    await this.logs.create({
      auteurId: user.userId,
      action: 'export_anomalies_excel',
      cibleId: user.userId,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Disposition', `attachment; filename="anomalies_${todayStr}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('sessions/excel')
  @Roles('gestionnaire', 'admin')
  async exportSessionsExcel(
    @User() user: any,
    @Res() res: Response,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const sessions = await this.prisma.sessionPresence.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, departement: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Attendance';
    const ws = wb.addWorksheet('Sessions');

    ws.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Employé', key: 'employe', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Département', key: 'departement', width: 20 },
      { header: 'Arrivée', key: 'arrivee', width: 22 },
      { header: 'Départ', key: 'depart', width: 22 },
      { header: 'Durée (min)', key: 'duree', width: 12 },
      { header: 'Méthode', key: 'methode', width: 15 },
      { header: 'Retard (min)', key: 'retard', width: 12 },
      { header: 'Valide', key: 'valide', width: 8 },
    ];

    for (const s of sessions) {
      let duree = '';
      if (s.heureDepart) {
        duree = String(Math.round((s.heureDepart.getTime() - s.heureArrivee.getTime()) / 60000));
      }
      ws.addRow({
        date: `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}-${String(s.date.getDate()).padStart(2, '0')}`,
        employe: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        email: s.user?.email || '',
        departement: s.user?.departement || '',
        arrivee: s.heureArrivee.toISOString(),
        depart: s.heureDepart ? s.heureDepart.toISOString() : '',
        duree,
        methode: s.methodeValidation,
        retard: s.retardMinutes ?? 0,
        valide: s.valide ? 'Oui' : 'Non',
      });
    }

    ws.getRow(1).font = { bold: true };

    await this.logs.create({
      auteurId: user.userId,
      action: 'export_sessions_excel',
      cibleId: user.userId,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    res.setHeader('Content-Disposition', `attachment; filename="sessions_${todayStr}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }
}
