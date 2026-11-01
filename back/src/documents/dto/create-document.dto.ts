import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CategorieDocumentEnum } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  nom: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  chemin: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  typeMime?: string;

  @IsOptional()
  @IsInt()
  taille?: number;

  @IsOptional()
  @IsEnum(CategorieDocumentEnum)
  categorie?: CategorieDocumentEnum;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  demandeId?: number;

  @IsOptional()
  @IsInt()
  entrepriseId?: number;
}