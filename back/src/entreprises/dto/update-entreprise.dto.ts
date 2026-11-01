import { PartialType } from '@nestjs/mapped-types';
import { CreateEntrepriseDto } from './create-entreprise.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEntrepriseDto extends PartialType(CreateEntrepriseDto) {
  @IsOptional()
  @IsBoolean()
  verifie?: boolean;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  motifSuspension?: string;

  @IsOptional()
  @IsString()
  produitPhare?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  photoCouverture?: string;
}