import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TypeMessageEnum } from '../../messages/entities/message.entity';

export class CreateMessageDto {
  @IsOptional()
  @IsEnum(TypeMessageEnum)
  type?: TypeMessageEnum;

  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsString()
  fichier?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class ProposerRdvDto {
  @IsString()
  dateRdv: string;

  @IsOptional()
  @IsString()
  lieuRdv?: string;

  @IsOptional()
  @IsString()
  contenu?: string;
}

export class RepondreRdvDto {
  @IsString()
  statut: 'ACCEPTE' | 'REFUSE';
}