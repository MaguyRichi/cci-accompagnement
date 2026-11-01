import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConventionDto {
  @Type(() => Number)
  @IsInt()
  apprentiId: number;

  @Type(() => Number)
  @IsInt()
  entrepriseId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tuteurId?: number;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsString()
  objectifs?: string;

  @IsOptional()
  @IsString()
  commentaireEntreprise?: string;
}