import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetierFPDEnum, StatutSessionEnum } from '../entities/enums';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEnum(MetierFPDEnum)
  metier: MetierFPDEnum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  placesTotales?: number;

  @IsOptional()
  @IsEnum(StatutSessionEnum)
  statut?: StatutSessionEnum;

  @IsOptional()
  @IsString()
  lieuFormation?: string;

  // ⬇️ NOUVEAU
  @IsOptional()
  @IsBoolean()
  estPrivee?: boolean;
}