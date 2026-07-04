import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ResolveAnomalyDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  geoloc_verifiee?: boolean;
}
