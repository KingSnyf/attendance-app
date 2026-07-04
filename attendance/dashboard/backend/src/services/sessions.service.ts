import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async checkin(
    userId: string,
    deviceId?: string,
    method = 'pin',
    latitude?: number,
    longitude?: number,
    bssid?: string,
    ipLocale?: string,
    estRetourPause?: boolean,
    codePin?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.actif) throw new ForbiddenException('Account is disabled');

    // Vérification verrouillage PIN
    if (user.blocagePinJusqua && user.blocagePinJusqua > new Date()) {
      const resteMin = Math.ceil((user.blocagePinJusqua.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Compte verrouillé pour cause de tentatives PIN échouées. Réessayer dans ${resteMin} min.`);
    }

    // Vérification du code PIN si méthode = pin
    if (method === 'pin' && codePin) {
      if (!user.codePinHash) {
        throw new BadRequestException('Aucun code PIN configuré pour cet utilisateur');
      }
      const pinOk = await bcrypt.compare(codePin, user.codePinHash);
      if (!pinOk) {
        const nouvellesTentatives = user.tentativesPin + 1;
        const updateData: any = { tentativesPin: nouvellesTentatives };
        if (nouvellesTentatives >= 5) {
          const delai = 30; // minutes de blocage
          updateData.blocagePinJusqua = new Date(Date.now() + delai * 60 * 1000);
          updateData.tentativesPin = 0; // reset après blocage
        }
        await this.prisma.user.update({ where: { id: userId }, data: updateData });

        const reste = 5 - nouvellesTentatives;
        throw new BadRequestException(
          `Code PIN incorrect. ${reste > 0 ? `Il vous reste ${reste} tentative(s).` : 'Compte verrouillé pour 30 minutes.'}`,
        );
      }
      // PIN OK → reset compteur
      if (user.tentativesPin > 0 || user.blocagePinJusqua) {
        await this.prisma.user.update({ where: { id: userId }, data: { tentativesPin: 0, blocagePinJusqua: null } });
      }
    }

    const active = await this.prisma.sessionPresence.findFirst({
      where: { userId, heureDepart: null },
    });
    if (active) throw new BadRequestException('User already has an active session');

    const settings = await this.prisma.setting.findFirst();
    if (!settings) throw new NotFoundException('Settings not configured');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Vérification jour férié
    const joursFeries: string[] = settings.joursFeries ? JSON.parse(settings.joursFeries) : [];
    const dateStr = this.localDateStr(today);
    if (joursFeries.includes(dateStr)) {
      throw new BadRequestException('Check-in not allowed on public holidays');
    }

    // Vérification jour ouvré
    const joursOuvres: string[] = settings.joursOuvres ? JSON.parse(settings.joursOuvres) : [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[now.getDay()];
    if (!joursOuvres.map((j) => j.toLowerCase()).includes(todayName.toLowerCase())) {
      throw new BadRequestException('Check-in not allowed on non-working days');
    }

    // Vérification BSSID WiFi
    let anomalies: { userId?: string; type: string; description: string; dateDetection: Date; traitee: boolean }[] = [];
    if (settings.reseauBssid && settings.reseauBssid !== '00:00:00:00:00:00' && bssid) {
      if (bssid.toLowerCase() !== settings.reseauBssid.toLowerCase()) {
        anomalies.push({
          userId,
          type: 'hors_reseau',
          description: `BSSID non reconnu: ${bssid} (attendu: ${settings.reseauBssid})`,
          dateDetection: now,
          traitee: false,
        });
      }
    }

    // Vérification plage IP locale
    if (settings.plageIpLocale && settings.plageIpLocale !== '192.168.1.0/24' && ipLocale) {
      const ipParts = ipLocale.split('.').map(Number);
      if (ipParts.length === 4) {
        const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
        const [range, bits] = settings.plageIpLocale.split('/');
        const rangeParts = range.split('.').map(Number);
        const rangeInt = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        if ((ipInt & mask) !== (rangeInt & mask)) {
          anomalies.push({
            userId,
            type: 'hors_reseau',
            description: `IP hors plage autorisée: ${ipLocale} (attendu: ${settings.plageIpLocale})`,
            dateDetection: now,
            traitee: false,
          });
        }
      }
    }

    // Vérification géofencing GPS
    if (latitude && longitude && settings.geofencingActif) {
      const rayon = settings.rayonGeofencingMetres ?? 120;
      const distance = this.calculerDistance(
        latitude, longitude,
        settings.latitudeBureau ?? 0, settings.longitudeBureau ?? 0,
      );
      if (distance > rayon) {
        anomalies.push({
          userId,
          type: 'geofencing_incoherent',
          description: `Pointage hors zone à ${distance.toFixed(0)}m du bureau (rayon autorisé: ${rayon}m)`,
          dateDetection: now,
          traitee: false,
        });
      }
    }

    // Créer les anomalies
    for (const a of anomalies) {
      await this.prisma.anomaly.create({ data: a });
    }

    // Calcul du retard
    const tolerance = settings.toleranceRetardMinutes ?? 15;
    const scheduledStart = new Date(today);
    scheduledStart.setHours(8, 0, 0, 0);
    const lateMinutes = now > scheduledStart ? Math.round((now.getTime() - scheduledStart.getTime()) / 60000) : 0;
    const retard = Math.max(0, lateMinutes - tolerance);

    // Vérification retour de pause
    if (estRetourPause) {
      const prevSession = await this.prisma.sessionPresence.findFirst({
        where: { userId, heureDepart: { not: null } },
        orderBy: { heureDepart: 'desc' },
      });
      if (prevSession?.heureDepart) {
        const breakMinutes = Math.round((now.getTime() - prevSession.heureDepart.getTime()) / 60000);
        const maxPause = settings.dureePauseMaxMinutes ?? 90;
        if (breakMinutes > maxPause) {
          await this.prisma.anomaly.create({
            data: {
              userId,
              type: 'pause_depassee',
              description: `Retour de pause après ${breakMinutes}min (max: ${maxPause}min)`,
              dateDetection: now,
              traitee: false,
            },
          });
        }
      }
    }

    // Un seul appareil actif par employé
    if (deviceId) {
      const activeDevice = await this.prisma.device.findFirst({
        where: { userId, actif: true, id: { not: deviceId } },
      });
      if (activeDevice) {
        await this.prisma.anomaly.create({
          data: {
            userId,
            type: 'device_different',
            description: `Badge depuis un appareil inconnu (ID: ${deviceId}) alors qu'un autre appareil est actif`,
            dateDetection: now,
            traitee: false,
          },
        });
      }
    }

    const session = await this.prisma.sessionPresence.create({
      data: {
        userId,
        date: today,
        heureArrivee: now,
        typeArrivee: anomalies.length > 0 ? 'manuel' : method === 'geofencing' ? 'automatique' : 'manuel',
        methodeValidation: method,
        appareilId: deviceId ?? null,
        retardMinutes: retard > 0 ? retard : 0,
        valide: anomalies.length === 0,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });

    await this.prisma.user.update({ where: { id: userId }, data: { statutActuel: 'present' } });

    return this.formatSession(session);
  }

  private calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6_371_000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  async checkout(userId: string, deviceId?: string) {
    const session = await this.prisma.sessionPresence.findFirst({
      where: { userId, heureDepart: null },
      orderBy: { heureArrivee: 'desc' },
    });
    if (!session) throw new BadRequestException('No open session found');

    const now = new Date();
    const updated = await this.prisma.sessionPresence.update({
      where: { id: session.id },
      data: { heureDepart: now },
    });

    await this.prisma.user.update({ where: { id: userId }, data: { statutActuel: 'en_attente' } });

    return this.formatSession(updated);
  }

  async list(userId: string) {
    const sessions = await this.prisma.sessionPresence.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return sessions.map((s) => this.formatSession(s));
  }

  async listAll(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    const sessions = await this.prisma.sessionPresence.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });
    return sessions.map((s) => ({
      ...this.formatSession(s),
      user: s.user,
    }));
  }

  async getActive() {
    const sessions = await this.prisma.sessionPresence.findMany({
      where: { heureDepart: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, departement: true } } },
    });
    return sessions.map((s) => ({
      ...this.formatSession(s),
      user: s.user,
    }));
  }

  async getTodaySessions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sessions = await this.prisma.sessionPresence.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, departement: true } } },
    });
    return sessions.map((s) => ({
      ...this.formatSession(s),
      user: s.user,
    }));
  }

  async getStats(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    const total = await this.prisma.sessionPresence.count({ where });
    const withRetard = await this.prisma.sessionPresence.count({ where: { ...where, retardMinutes: { gt: 0 } } });
    const valides = await this.prisma.sessionPresence.count({ where: { ...where, valide: true } });
    const actives = await this.prisma.sessionPresence.count({ where: { heureDepart: null } });

    const totalUsers = await this.prisma.user.count({ where: { actif: true } });
    const presents = await this.prisma.user.count({ where: { statutActuel: 'present' } });
    const enPause = await this.prisma.user.count({ where: { statutActuel: 'en_attente' } });

    // Calcul heures supplémentaires (sessions avec départ après 17h)
    const sessions = await this.prisma.sessionPresence.findMany({
      where: { ...where, heureDepart: { not: null } },
    });
    let totalHeuresSupMinutes = 0;
    for (const s of sessions) {
      if (s.heureDepart) {
        const fin = new Date(s.heureDepart);
        const dixSept = new Date(fin);
        dixSept.setHours(17, 0, 0, 0);
        if (fin > dixSept) {
          totalHeuresSupMinutes += Math.round((fin.getTime() - dixSept.getTime()) / 60000);
        }
      }
    }

    // Temps de présence total
    let totalPresenceMinutes = 0;
    for (const s of sessions) {
      if (s.heureDepart) {
        totalPresenceMinutes += Math.round((s.heureDepart.getTime() - s.heureArrivee.getTime()) / 60000);
      }
    }

    return {
      totalSessions: total,
      sessionsWithRetard: withRetard,
      valides,
      actives,
      presents,
      en_pause: enPause,
      absents: totalUsers - presents - enPause,
      totalUsers,
      tempsPresenceTotalHeures: Math.round(totalPresenceMinutes / 60 * 100) / 100,
      heuresSupplementairesHeures: Math.round(totalHeuresSupMinutes / 60 * 100) / 100,
    };
  }

  async getDashboard() {
    const totalUsers = await this.prisma.user.count({ where: { actif: true } });
    const presents = await this.prisma.user.count({ where: { statutActuel: 'present' } });
    const enPause = await this.prisma.user.count({ where: { statutActuel: 'en_attente' } });
    const anomaliesNonTraitees = await this.prisma.anomaly.count({ where: { traitee: false } });

    const geofencingAlerts = await this.prisma.anomaly.findMany({
      where: { type: 'geofencing_incoherent', traitee: false },
      orderBy: { dateDetection: 'desc' },
      take: 20,
    });

    const employees = await this.prisma.user.findMany({
      where: { actif: true },
      orderBy: { dateCreation: 'desc' },
      include: { devices: { where: { actif: true }, take: 1 } },
    });

    // Présence hebdomadaire (7 derniers jours)
    const weeklyPresence: Array<{ label: string; presents: number; absents: number }> = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);
      const sessions = await this.prisma.sessionPresence.findMany({
        where: { date: { gte: dateStart, lt: dateEnd } },
      });
      const uniqueUsers = new Set(sessions.map((s) => s.userId));
      weeklyPresence.push({
        label: dayNames[d.getDay()],
        presents: uniqueUsers.size,
        absents: Math.max(0, totalUsers - uniqueUsers.size),
      });
    }

    // Présence mensuelle (4 dernières semaines)
    const monthlyPresence: Array<{ label: string; presents: number; absents: number }> = [];
    for (let w = 3; w >= 0; w--) {
      const end = new Date();
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const sessions = await this.prisma.sessionPresence.findMany({
        where: { date: { gte: start, lt: end } },
      });
      const uniqueUsers = new Set(sessions.map((s) => s.userId));
      monthlyPresence.push({
        label: `S${4 - w}`,
        presents: uniqueUsers.size,
        absents: Math.max(0, totalUsers - uniqueUsers.size),
      });
    }

    // Présence du jour par utilisateur (première arrivée + temps cumulé)
    // -> alimente les colonnes "Arrivée" et "Temps cumulé" du dashboard
    const jourDebut = new Date();
    jourDebut.setHours(0, 0, 0, 0);
    const jourFin = new Date(jourDebut);
    jourFin.setDate(jourFin.getDate() + 1);

    const sessionsDuJour = await this.prisma.sessionPresence.findMany({
      where: { date: { gte: jourDebut, lt: jourFin } },
      orderBy: { heureArrivee: 'asc' },
    });

    const maintenant = new Date();
    const presenceParUtilisateur = new Map<string, { premiereArrivee: Date; minutes: number }>();
    for (const s of sessionsDuJour) {
      const fin = s.heureDepart ?? maintenant;
      const minutes = Math.max(0, Math.round((fin.getTime() - s.heureArrivee.getTime()) / 60000));
      const existant = presenceParUtilisateur.get(s.userId);
      if (existant) {
        existant.minutes += minutes;
        if (s.heureArrivee < existant.premiereArrivee) existant.premiereArrivee = s.heureArrivee;
      } else {
        presenceParUtilisateur.set(s.userId, { premiereArrivee: s.heureArrivee, minutes });
      }
    }

    return {
      stats: {
        presents,
        absents: totalUsers - presents - enPause,
        enPause,
        anomaliesNonTraitees,
      },
      geofencingAlerts: geofencingAlerts.map((a) => ({
        id: a.id,
        user_id: a.userId,
        type: a.type,
        description: a.description,
        date_detection: a.dateDetection.toISOString(),
        traitee: a.traitee,
        geoloc_verifiee: a.geolocVerifiee,
      })),
      employees: employees.map((u) => {
        const presenceJour = presenceParUtilisateur.get(u.id);
        return {
          id: u.id,
          nom: u.lastName || '',
          prenom: u.firstName || '',
          email: u.email,
          role: u.role,
          statut_actuel: u.statutActuel || 'absent',
          departement: u.departement || '',
          actif: u.actif,
          photo_url: u.photoUrl || null,
          premiere_arrivee: presenceJour ? presenceJour.premiereArrivee.toISOString() : null,
          temps_cumule_minutes: presenceJour ? presenceJour.minutes : null,
          appareil: u.devices?.[0]
            ? {
                id: u.devices[0].id,
                identifiant_appareil: u.devices[0].identifiantAppareil,
                modele: u.devices[0].modele,
                actif: u.devices[0].actif,
              }
            : null,
        };
      }),
      weeklyPresence,
      monthlyPresence,
    };
  }

  async getMonthlyStats(year?: number) {
    const annee = year || new Date().getFullYear();
    const result: any[] = [];

    for (let mois = 0; mois < 12; mois++) {
      const debut = new Date(annee, mois, 1);
      const fin = new Date(annee, mois + 1, 1);

      const sessions = await this.prisma.sessionPresence.findMany({
        where: {
          date: { gte: debut, lt: fin },
        },
      });

      const totalSessions = sessions.length;
      const withRetard = sessions.filter((s) => (s.retardMinutes ?? 0) > 0).length;
      const withDepart = sessions.filter((s) => s.heureDepart).length;

      let totalMinutes = 0;
      let heuresSupMinutes = 0;
      for (const s of sessions) {
        if (s.heureDepart) {
          const duree = Math.round((s.heureDepart.getTime() - s.heureArrivee.getTime()) / 60000);
          totalMinutes += duree;

          const finDate = new Date(s.heureDepart);
          const dixSept = new Date(finDate);
          dixSept.setHours(17, 0, 0, 0);
          if (finDate > dixSept) {
            heuresSupMinutes += Math.round((finDate.getTime() - dixSept.getTime()) / 60000);
          }
        }
      }

      const utilisateursActifs = await this.prisma.user.count({ where: { actif: true } });
      const joursOuvres = this.getJoursOuvres(mois, annee);

      result.push({
        mois: mois + 1,
        annee,
        totalSessions,
        sessionsAvecRetard: withRetard,
        sessionsAvecDepart: withDepart,
        tempsPresenceHeures: Math.round(totalMinutes / 60 * 100) / 100,
        heuresSupplementairesHeures: Math.round(heuresSupMinutes / 60 * 100) / 100,
        moyenneHeuresParJour: withDepart > 0 ? Math.round((totalMinutes / withDepart) / 60 * 100) / 100 : 0,
        joursOuvres: joursOuvres.length,
        joursTravailles: withDepart,
        tauxPresence: joursOuvres.length > 0 ? Math.round((withDepart / joursOuvres.length) * 10000) / 100 : 0,
        utilisateursActifs,
      });
    }

    return result;
  }

  private getJoursOuvres(mois: number, annee: number): Date[] {
    const jours: Date[] = [];
    const settings = this.prisma.setting.findFirst();
    // Fallback: lundi-vendredi
    const joursOuvresNoms = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    const dernierJour = new Date(annee, mois + 1, 0).getDate();
    for (let jour = 1; jour <= dernierJour; jour++) {
      const d = new Date(annee, mois, jour);
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
      if (joursOuvresNoms.includes(dayName)) {
        jours.push(d);
      }
    }

    // Enlever les jours fériés (asynchrone non pratique ici, faire confiance aux settings)
    return jours;
  }

  async detecterPausesDepassees() {
    const settings = await this.prisma.setting.findFirst();
    const maxPause = settings?.dureePauseMaxMinutes ?? 90;
    const now = new Date();

    const enPause = await this.prisma.user.findMany({
      where: { statutActuel: 'en_attente' },
    });

    const results: any[] = [];
    for (const user of enPause) {
      const derniereSession = await this.prisma.sessionPresence.findFirst({
        where: { userId: user.id, heureDepart: { not: null } },
        orderBy: { heureDepart: 'desc' },
      });

      if (derniereSession?.heureDepart) {
        const minutesPause = Math.round((now.getTime() - derniereSession.heureDepart.getTime()) / 60000);
        if (minutesPause > maxPause) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { statutActuel: 'absent' },
          });

          await this.prisma.anomaly.create({
            data: {
              userId: user.id,
              type: 'pause_depassee',
              description: `Pause dépassée: ${minutesPause}min écoulées (max: ${maxPause}min) — passage en absent automatique`,
              dateDetection: now,
              traitee: false,
            },
          });

          results.push({ userId: user.id, minutesPause, bascule: 'absent' });
        }
      }
    }
    return results;
  }

  async updateSession(id: string, data: { heureArrivee?: string; heureDepart?: string; valide?: boolean; retardMinutes?: number }) {
    const session = await this.prisma.sessionPresence.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    const updateData: any = {};
    if (data.heureArrivee) updateData.heureArrivee = new Date(data.heureArrivee);
    if (data.heureDepart !== undefined) updateData.heureDepart = data.heureDepart ? new Date(data.heureDepart) : null;
    if (data.valide !== undefined) updateData.valide = data.valide;
    if (data.retardMinutes !== undefined) updateData.retardMinutes = data.retardMinutes;

    const updated = await this.prisma.sessionPresence.update({ where: { id }, data: updateData });
    return this.formatSession(updated);
  }

  async deleteSession(id: string) {
    const session = await this.prisma.sessionPresence.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.sessionPresence.delete({ where: { id } });
    return { deleted: true, id };
  }

  private formatSession(s: any) {
    let heuresSupMinutes = 0;
    if (s.heureDepart) {
      const fin = new Date(s.heureDepart);
      const dixSept = new Date(fin);
      dixSept.setHours(17, 0, 0, 0);
      if (fin > dixSept) {
        heuresSupMinutes = Math.round((fin.getTime() - dixSept.getTime()) / 60000);
      }
    }

    return {
      id: s.id,
      user_id: s.userId,
      date: this.localDateStr(s.date),
      heure_arrivee: s.heureArrivee.toISOString(),
      heure_depart: s.heureDepart ? s.heureDepart.toISOString() : null,
      methode_validation: s.methodeValidation,
      retard_minutes: s.retardMinutes ?? 0,
      valide: s.valide,
      lieu: s.latitude && s.longitude ? 'bureau' : 'externe',
      heures_sup_minutes: heuresSupMinutes,
    };
  }
}