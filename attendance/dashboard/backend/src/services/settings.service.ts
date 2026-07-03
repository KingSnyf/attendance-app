import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    let settings = await this.prisma.setting.findFirst();
    if (!settings) {
      settings = await this.prisma.setting.create({
        data: {
          reseauBssid: '00:00:00:00:00:00',
          plageIpLocale: '192.168.1.0/24',
          toleranceRetardMinutes: 15,
          dureePauseMaxMinutes: 90,
          joursFeries: JSON.stringify([]),
          joursOuvres: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
          politiqueConfidentialite: '',
          geolocalisationSecoursActive: false,
          geofencingActif: false,
          rayonGeofencingMetres: 120,
          latitudeBureau: 3.848,
          longitudeBureau: 11.5021,
        },
      });
    }
    return this.formatSettings(settings);
  }

  async update(payload: any) {
    let settings = await this.prisma.setting.findFirst();
    if (!settings) throw new NotFoundException('Settings not found');

    const data: any = {};
    if (payload.reseau_bssid !== undefined) data.reseauBssid = payload.reseau_bssid;
    if (payload.reseauBssid !== undefined) data.reseauBssid = payload.reseauBssid;
    if (payload.plage_ip_locale !== undefined) data.plageIpLocale = payload.plage_ip_locale;
    if (payload.plageIpLocale !== undefined) data.plageIpLocale = payload.plageIpLocale;
    if (payload.tolerance_retard_minutes !== undefined) data.toleranceRetardMinutes = payload.tolerance_retard_minutes;
    if (payload.toleranceRetardMinutes !== undefined) data.toleranceRetardMinutes = payload.toleranceRetardMinutes;
    if (payload.duree_pause_max_minutes !== undefined) data.dureePauseMaxMinutes = payload.duree_pause_max_minutes;
    if (payload.dureePauseMaxMinutes !== undefined) data.dureePauseMaxMinutes = payload.dureePauseMaxMinutes;
    if (payload.jours_feries !== undefined) data.joursFeries = JSON.stringify(payload.jours_feries);
    if (payload.joursFeries !== undefined) data.joursFeries = JSON.stringify(payload.joursFeries);
    if (payload.jours_ouvres !== undefined) data.joursOuvres = JSON.stringify(payload.jours_ouvres);
    if (payload.joursOuvres !== undefined) data.joursOuvres = JSON.stringify(payload.joursOuvres);
    if (payload.geofencing_actif !== undefined) data.geofencingActif = payload.geofencing_actif;
    if (payload.geofencingActif !== undefined) data.geofencingActif = payload.geofencingActif;
    if (payload.rayon_geofencing_metres !== undefined) data.rayonGeofencingMetres = payload.rayon_geofencing_metres;
    if (payload.rayonGeofencingMetres !== undefined) data.rayonGeofencingMetres = payload.rayonGeofencingMetres;
    if (payload.coordonnees_bureau?.lat !== undefined) data.latitudeBureau = payload.coordonnees_bureau.lat;
    if (payload.coordonnees_bureau?.lng !== undefined) data.longitudeBureau = payload.coordonnees_bureau.lng;
    if (payload.latitudeBureau !== undefined) data.latitudeBureau = payload.latitudeBureau;
    if (payload.longitudeBureau !== undefined) data.longitudeBureau = payload.longitudeBureau;
    if (payload.politique_confidentialite !== undefined) data.politiqueConfidentialite = payload.politique_confidentialite;
    if (payload.politiqueConfidentialite !== undefined) data.politiqueConfidentialite = payload.politiqueConfidentialite;
    if (payload.geolocalisation_secours_active !== undefined) data.geolocalisationSecoursActive = payload.geolocalisation_secours_active;
    if (payload.geolocalisationSecoursActive !== undefined) data.geolocalisationSecoursActive = payload.geolocalisationSecoursActive;

    const updated = await this.prisma.setting.update({
      where: { id: settings.id },
      data,
    });
    return this.formatSettings(updated);
  }

  private formatSettings(s: any) {
    return {
      reseau_bssid: s.reseauBssid,
      plage_ip_locale: s.plageIpLocale,
      tolerance_retard_minutes: s.toleranceRetardMinutes,
      duree_pause_max_minutes: s.dureePauseMaxMinutes,
      jours_feries: s.joursFeries ? JSON.parse(s.joursFeries) : [],
      jours_ouvres: s.joursOuvres ? JSON.parse(s.joursOuvres) : [],
      politique_confidentialite: s.politiqueConfidentialite || '',
      geolocalisation_secours_active: s.geolocalisationSecoursActive ?? false,
      geofencing_actif: s.geofencingActif,
      rayon_geofencing_metres: s.rayonGeofencingMetres,
      coordonnees_bureau: {
        lat: s.latitudeBureau,
        lng: s.longitudeBureau,
      },
    };
  }
}
