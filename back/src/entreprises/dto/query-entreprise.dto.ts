import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEntrepriseDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  q?: string; // recherche (nom, NIF, sigle, produit phare)

  @IsOptional()
  @IsString()
  secteur?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  taille?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  verifie?: string; // "true" | "false"

  @IsOptional()
  @IsString()
  hasMentor?: string; // "true" | "false"

  @IsOptional()
  @IsString()
  sort?: string; // "recent" | "note" | "vues" | "nom"
}