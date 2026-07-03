import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ResolveAnomalyDto {
  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsBoolean()
  geolocVerifiee?: boolean;
}
