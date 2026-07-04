import { IsString, IsIn } from 'class-validator';

export class ProcessModificationDto {
  @IsString()
  @IsIn(['approve', 'reject', 'validee', 'rejetee'])
  action!: string;
}
