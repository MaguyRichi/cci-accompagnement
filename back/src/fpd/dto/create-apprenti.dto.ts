import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenreEnum, NiveauEtudeEnum, MetierFPDEnum } from '../entities/enums';

export class CreateApprentiDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  telephone: string;

  @IsDateString()
  dateNaissance: string;

  @IsEnum(GenreEnum)
  genre: GenreEnum;

  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsEnum(NiveauEtudeEnum)
  niveauEtude: NiveauEtudeEnum;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  motivation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sessionId?: number;

  @IsOptional()
  @IsEnum(MetierFPDEnum)
  metier?: MetierFPDEnum;
}