import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  SousTypeCollabEnum,
  TypeDemandeEnum,
} from '../entities/demande.entity';

export class CreateDemandeDto {
  @IsNotEmpty()
  @IsEnum(TypeDemandeEnum)
  type: TypeDemandeEnum;

  @IsOptional()
  @IsEnum(SousTypeCollabEnum)
  sousType?: SousTypeCollabEnum;

  @IsOptional()
  @IsInt()
  entrepriseId?: number;

  @IsOptional()
  @IsInt()
  cibleId?: number;              // mentor visé (pour MENTORAT)

  @IsOptional()
  @IsInt()
  cibleEntrepriseId?: number;    // PME visée (pour COLLABORATION)

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  besoinDetaille?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  volume?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  localisationCible?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  secteurConcerne?: string;

  @IsOptional()
  @IsString()
  dateSouhaitee?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dureeEstimee?: string;

  @IsOptional()
  visiblePubliquement?: boolean;
}