import { IsString } from 'class-validator';

export class VerifyZoneDto {
  @IsString()
  bssid!: string;

  @IsString()
  ipLocale!: string;
}
