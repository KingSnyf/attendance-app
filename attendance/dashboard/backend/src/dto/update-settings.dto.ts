import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() reseauBssid?: string;
  @IsOptional() @IsString() reseauSsid?: string;
  @IsOptional() @IsString() reseau_bssid?: string;
  @IsOptional() @IsString() plageIpLocale?: string;
  @IsOptional() @IsString() plage_ip_locale?: string;
  @IsOptional() @IsNumber() toleranceRetardMinutes?: number;
  @IsOptional() @IsNumber() tolerance_retard_minutes?: number;
  @IsOptional() @IsNumber() dureePauseMaxMinutes?: number;
  @IsOptional() @IsNumber() duree_pause_max_minutes?: number;
  @IsOptional() @IsArray() joursFeries?: string[];
  @IsOptional() @IsArray() jours_feries?: string[];
  @IsOptional() @IsArray() joursOuvres?: string[];
  @IsOptional() @IsArray() jours_ouvres?: string[];
  @IsOptional() @IsBoolean() geofencingActif?: boolean;
  @IsOptional() @IsBoolean() geofencing_actif?: boolean;
  @IsOptional() @IsNumber() rayonGeofencingMetres?: number;
  @IsOptional() @IsNumber() rayon_geofencing_metres?: number;
  @IsOptional() @IsNumber() latitudeBureau?: number;
  @IsOptional() @IsNumber() longitudeBureau?: number;
  @IsOptional() @IsString() politiqueConfidentialite?: string;
  @IsOptional() @IsString() politique_confidentialite?: string;
  @IsOptional() @IsBoolean() geolocalisationSecoursActive?: boolean;
  @IsOptional() @IsBoolean() geolocalisation_secours_active?: boolean;

  // Heures standard de la journée
  @IsOptional() @IsString() heureDebutJournee?: string;
  @IsOptional() @IsString() heure_debut_journee?: string;
  @IsOptional() @IsString() heureFinJournee?: string;
  @IsOptional() @IsString() heure_fin_journee?: string;

  // Coordonnees bureau (objet)
  @IsOptional() coordonnees_bureau?: { lat: number; lng: number };
}
