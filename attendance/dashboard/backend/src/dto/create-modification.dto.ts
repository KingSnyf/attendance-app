import { IsString, IsUUID } from 'class-validator';

export class CreateModificationDto {
  @IsUUID()
  gestionnaireId!: string;

  @IsUUID()
  sessionPresenceId!: string;

  @IsString()
  modificationProposee!: string;

  @IsString()
  raison!: string;
}
