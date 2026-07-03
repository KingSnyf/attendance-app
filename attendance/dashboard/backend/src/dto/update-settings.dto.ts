import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  reseauBssid?: string;

  @IsOptional()
  @IsString()
  plageIpLocale?: string;

  @IsOptional()
  @IsNumber()
  toleranceRetardMinutes?: number;

  @IsOptional()
  @IsNumber()
  dureePauseMaxMinutes?: number;

  @IsOptional()
  @IsArray()
  joursFeries?: string[];

  @IsOptional()
  @IsArray()
  joursOuvres?: string[];

  @IsOptional()
  @IsBoolean()
  geofencingActif?: boolean;

  @IsOptional()
  @IsNumber()
  rayonGeofencingMetres?: number;

  @IsOptional()
  @IsNumber()
  latitudeBureau?: number;

  @IsOptional()
  @IsNumber()
  longitudeBureau?: number;
}
