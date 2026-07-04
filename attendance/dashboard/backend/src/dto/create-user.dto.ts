import { IsString, IsEmail, IsOptional, MinLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsIn(['employe', 'gestionnaire', 'admin'])
  role?: string;

  @IsOptional()
  @IsString()
  departement?: string;
}
