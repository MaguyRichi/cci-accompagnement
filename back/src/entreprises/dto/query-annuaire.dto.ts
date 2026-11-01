import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnnuaireDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  secteur?: string;

  @IsOptional()
  @IsString()
  filiere?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  taille?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  effectifMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  effectifMax?: number;

  @IsOptional()
  @IsString()
  verifie?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}