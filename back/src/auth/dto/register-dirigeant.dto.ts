import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDirigeantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nom: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  prenom: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  telephone: string;

  // Infos entreprise
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  raisonSociale: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sigle?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nif: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  stat: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  rcs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  formeJuridique?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  secteur: string;

  @IsOptional()
  @IsString()
  taille?: string;

  @IsOptional()
  effectif?: number;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  description?: string;
}