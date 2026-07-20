import { IsString, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Le code PIN doit contenir 4 chiffres' })
  currentPin!: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Le nouveau code PIN doit contenir 4 chiffres' })
  newPin!: string;
}
