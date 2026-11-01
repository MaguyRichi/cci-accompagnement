import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TraiterDemandeDto {
  @IsOptional()
  @IsString()
  motifRefus?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RefuserDemandeDto {
  @IsNotEmpty()
  @IsString()
  motifRefus: string;
}

export class DemanderRdvDto {
  @IsOptional()
  @IsString()
  dateSouhaitee?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}