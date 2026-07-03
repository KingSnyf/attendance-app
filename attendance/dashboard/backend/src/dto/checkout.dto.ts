import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
