import { IsString, IsIn } from 'class-validator';

export class ProcessModificationDto {
  @IsString()
  @IsIn(['validee', 'rejetee'])
  statut!: string;

  @IsString()
  adminId!: string;
}
