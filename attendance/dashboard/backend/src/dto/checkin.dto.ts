import { IsString, IsOptional, IsNumber, IsUUID, IsBoolean } from 'class-validator';

export class CheckinDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  bssid?: string;

  @IsOptional()
  @IsString()
  ipLocale?: string;

  @IsOptional()
  @IsBoolean()
  estRetourPause?: boolean;

  @IsOptional()
  @IsString()
  codePin?: string;
}
