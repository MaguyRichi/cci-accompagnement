import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TypeQuestionEnum } from '../entities/question-diagnostic.entity';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  categorie: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sousCategorie?: string;

  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TypeQuestionEnum)
  typeReponse?: TypeQuestionEnum;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  poids?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;

  @IsOptional()
  @IsBoolean()
  obligatoire?: boolean;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}