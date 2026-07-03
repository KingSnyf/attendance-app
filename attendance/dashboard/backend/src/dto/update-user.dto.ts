import { IsString, IsEmail, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsIn(['employe', 'gestionnaire', 'admin'])
  role?: string;

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsIn(['present', 'absent', 'en_attente', 'pause'])
  statutActuel?: string;
}
