import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDocumentDto {
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
  categorie?: string;

  @IsOptional()
  @IsString()
  entrepriseId?: string;

  @IsOptional()
  @IsString()
  demandeId?: string;

  @IsOptional()
  @IsString()
  valide?: string;
}