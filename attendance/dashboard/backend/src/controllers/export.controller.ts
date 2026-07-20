import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';
import { LogsService } from '../services/logs.service';
import { User } from '../auth/user.decorator';
import {
  formatDateFr, formatTimeFr, formatDateTimeFr, formatDuree,
  formatDateShort, todayStr, buildCsv,
} from '../utils/export-formatter.util';

const EXPORT_LIMIT = 10000;

function calculDuree(arrivee: Date, depart: Date): number {
  return Math.round((depart.getTime() - arrivee.getTime()) / 60000);
}

function calculHeuresSup(depart: Date): number {
  const fin = new Date(depart);
  const seuil = new Date(fin);
  seuil.setHours(17, 0, 0, 0);
  return fin > seuil ? Math.round((fin.getTime() - seuil.getTime()) / 60000) : 0;
}

@Controller('export')
@UseGuards(AuthGuard('jwt'), RolesGuard)
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
    const sessions = await this.findSessions(dateFrom, dateTo, userId);
    const rows = sessions.map((s) => {
      const duree = s.heureDepart ? calculDuree(s.heureArrivee, s.heureDepart) : 0;
      const heuresSup = s.heureDepart ? calculHeuresSup(s.heureDepart) : 0;
      return [
        formatDateFr(s.date),
        `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        s.user?.email || '',
        s.user?.departement || '',
        formatTimeFr(s.heureArrivee),
        s.heureDepart ? formatTimeFr(s.heureDepart) : '',
        duree,
        s.methodeValidation,
        s.retardMinutes ?? 0,
        s.valide ? 'Oui' : 'Non',
        heuresSup,
      ];
    });
    const csv = buildCsv(['Date', 'Employé', 'Email', 'Département', 'Arrivée', 'Départ', 'Durée (min)', 'Méthode', 'Retard (min)', 'Valide', 'Heures sup (min)'], rows);

    await this.logs.create({ auteurId: user.userId, action: 'export_sessions_csv', cibleId: user.userId, details: `Export CSV sessions du ${dateFrom || 'début'} au ${dateTo || 'fin'}` });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sessions_${todayStr()}.csv"`);
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
    const anomalies = await this.findAnomalies(type, traitee);
    const rows = anomalies.map((a) => [
      formatDateTimeFr(a.dateDetection),
      `${a.user?.firstName || ''} ${a.user?.lastName || ''}`,
      a.user?.email || '',
      a.type,
      a.description || '',
      a.traitee ? 'Oui' : 'Non',
      a.commentaire || '',
    ]);
    const csv = buildCsv(['Date', 'Employé', 'Email', 'Type', 'Description', 'Traitée', 'Commentaire'], rows);

    await this.logs.create({ auteurId: user.userId, action: 'export_anomalies_csv', cibleId: user.userId });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="anomalies_${todayStr()}.csv"`);
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
    const anomalies = await this.findAnomalies(type, traitee);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Attendance';
    const ws = wb.addWorksheet('Anomalies');
    ws.columns = [
      { header: 'Date', key: 'date', width: 20 }, { header: 'Employé', key: 'employe', width: 25 },
      { header: 'Email', key: 'email', width: 30 }, { header: 'Type', key: 'type', width: 16 },
      { header: 'Description', key: 'description', width: 45 }, { header: 'Traitée', key: 'traitee', width: 10 },
      { header: 'Commentaire', key: 'commentaire', width: 40 },
    ];
    for (const a of anomalies) {
      ws.addRow({
        date: formatDateTimeFr(a.dateDetection),
        employe: `${a.user?.firstName || ''} ${a.user?.lastName || ''}`,
        email: a.user?.email || '',
        type: a.type,
        description: a.description || '',
        traitee: a.traitee ? 'Oui' : 'Non',
        commentaire: a.commentaire || '',
      });
    }
    ws.getRow(1).font = { bold: true };

    await this.logs.create({ auteurId: user.userId, action: 'export_anomalies_excel', cibleId: user.userId });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="anomalies_${todayStr()}.xlsx"`);
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
    const sessions = await this.findSessions(dateFrom, dateTo);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Attendance';
    const ws = wb.addWorksheet('Sessions');
    ws.columns = [
      { header: 'Date', key: 'date', width: 14 }, { header: 'Employé', key: 'employe', width: 25 },
      { header: 'Email', key: 'email', width: 30 }, { header: 'Département', key: 'departement', width: 18 },
      { header: 'Arrivée', key: 'arrivee', width: 10 }, { header: 'Départ', key: 'depart', width: 10 },
      { header: 'Durée', key: 'duree', width: 10 }, { header: 'Méthode', key: 'methode', width: 14 },
      { header: 'Retard', key: 'retard', width: 10 }, { header: 'Valide', key: 'valide', width: 8 },
    ];
    for (const s of sessions) {
      ws.addRow({
        date: formatDateFr(s.date),
        employe: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        email: s.user?.email || '',
        departement: s.user?.departement || '',
        arrivee: formatTimeFr(s.heureArrivee),
        depart: s.heureDepart ? formatTimeFr(s.heureDepart) : '',
        duree: s.heureDepart ? formatDuree(calculDuree(s.heureArrivee, s.heureDepart)) : '',
        methode: s.methodeValidation,
        retard: `${s.retardMinutes ?? 0} min`,
        valide: s.valide ? 'Oui' : 'Non',
      });
    }
    ws.getRow(1).font = { bold: true };

    await this.logs.create({ auteurId: user.userId, action: 'export_sessions_excel', cibleId: user.userId });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sessions_${todayStr()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('sessions/pdf')
  @Roles('gestionnaire', 'admin')
  async exportSessionsPdf(
    @User() user: any,
    @Res() res: Response,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const sessions = await this.findSessions(dateFrom, dateTo);
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sessions_${todayStr()}.pdf"`);
    doc.pipe(res);
    this.drawPdfSessions(doc, sessions);

    await this.logs.create({ auteurId: user.userId, action: 'export_sessions_pdf', cibleId: user.userId });
    doc.end();
  }

  @Get('anomalies/pdf')
  @Roles('gestionnaire', 'admin')
  async exportAnomaliesPdf(
    @User() user: any,
    @Res() res: Response,
    @Query('type') type?: string,
    @Query('traitee') traitee?: string,
  ) {
    const anomalies = await this.findAnomalies(type, traitee);
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="anomalies_${todayStr()}.pdf"`);
    doc.pipe(res);
    this.drawPdfAnomalies(doc, anomalies);

    await this.logs.create({ auteurId: user.userId, action: 'export_anomalies_pdf', cibleId: user.userId });
    doc.end();
  }

  private async findSessions(dateFrom?: string, dateTo?: string, userId?: string) {
    const where: any = {};
    if (dateFrom || dateTo) { where.date = {}; if (dateFrom) where.date.gte = new Date(dateFrom); if (dateTo) where.date.lte = new Date(dateTo); }
    if (userId) where.userId = userId;
    return this.prisma.sessionPresence.findMany({
      where,
      orderBy: { date: 'desc' },
      take: EXPORT_LIMIT,
      include: { user: { select: { firstName: true, lastName: true, email: true, departement: true } } },
    });
  }

  private async findAnomalies(type?: string, traitee?: string) {
    const where: any = {};
    if (type && type !== 'all') where.type = type;
    if (traitee !== undefined) where.traitee = traitee === 'true';
    return this.prisma.anomaly.findMany({
      where,
      orderBy: { dateDetection: 'desc' },
      take: EXPORT_LIMIT,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  private drawPdfSessions(doc: PDFKit.PDFDocument, sessions: any[]) {
    doc.fontSize(16).text('Rapport des sessions', { align: 'center' });
    doc.fontSize(10).text(`Généré le ${formatDateFr(new Date())}`, { align: 'center' });
    doc.moveDown(1.5);
    const headers = ['Date', 'Employé', 'Arrivée', 'Départ', 'Durée', 'Retard', 'Valide'];
    const colWidths = [90, 170, 90, 90, 70, 60, 50];
    this.drawPdfTable(doc, headers, colWidths, sessions.map((s) => [
      formatDateFr(s.date),
      `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
      formatTimeFr(s.heureArrivee),
      s.heureDepart ? formatTimeFr(s.heureDepart) : '-',
      s.heureDepart ? formatDuree(calculDuree(s.heureArrivee, s.heureDepart)) : '-',
      `${s.retardMinutes ?? 0} min`,
      s.valide ? 'Oui' : 'Non',
    ]));
  }

  private drawPdfAnomalies(doc: PDFKit.PDFDocument, anomalies: any[]) {
    doc.fontSize(16).text('Rapport des anomalies', { align: 'center' });
    doc.fontSize(10).text(`Généré le ${formatDateFr(new Date())}`, { align: 'center' });
    doc.moveDown(1.5);
    const headers = ['Date', 'Employé', 'Type', 'Description', 'Traitée'];
    const colWidths = [120, 150, 80, 320, 50];
    this.drawPdfTable(doc, headers, colWidths, anomalies.map((a) => [
      formatDateTimeFr(a.dateDetection),
      `${a.user?.firstName || ''} ${a.user?.lastName || ''}`,
      a.type,
      a.description || '',
      a.traitee ? 'Oui' : 'Non',
    ]));
  }

  private drawPdfTable(doc: PDFKit.PDFDocument, headers: string[], colWidths: number[], rows: string[][]) {
    const startX = 30;
    let y = doc.y;

    doc.font('Helvetica-Bold').fontSize(8);
    let x = startX;
    headers.forEach((h, i) => { doc.text(h, x, y, { width: colWidths[i] }); x += colWidths[i]; });
    doc.moveDown(0.5);
    doc.font('Helvetica');

    for (const row of rows) {
      x = startX;
      y = doc.y;
      if (y > 550) { doc.addPage(); y = 30; }
      doc.fontSize(7);
      row.forEach((cell, i) => { doc.text(cell, x, y, { width: colWidths[i] }); x += colWidths[i]; });
    }
  }
}
