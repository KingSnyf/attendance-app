import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @IsUUID()
  userId!: string;

  @IsString()
  identifiantAppareil!: string;

  @IsOptional()
  @IsString()
  modele?: string;
}
