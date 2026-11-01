import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MetierFPDEnum, StatutSessionEnum } from '../entities/enums';
import { StatutInscriptionFPDEnum } from '../entities/inscription-fpd.entity';

export class QuerySessionsFPDDto {
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
  @IsEnum(MetierFPDEnum)
  metier?: MetierFPDEnum;

  @IsOptional()
  @IsEnum(StatutSessionEnum)
  statut?: StatutSessionEnum;
}

export class QueryInscriptionsFPDDto {
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
  @IsEnum(StatutInscriptionFPDEnum)
  statut?: StatutInscriptionFPDEnum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sessionId?: number;

  @IsOptional()
  @IsString()
  q?: string;
}