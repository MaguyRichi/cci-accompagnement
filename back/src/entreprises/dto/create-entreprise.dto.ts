import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEntrepriseDto {
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
  @MaxLength(100)
  sousSecteur?: string;

  @IsOptional()
  @IsString()
  taille?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  effectif?: number;

  @IsOptional()
  @IsNumber()
  chiffreAffaires?: number;

  @IsOptional()
  @IsString()
  anneeCreation?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  produitPhare?: string;

  @IsOptional()
  @IsArray()
  listeProduits?: any[];

  @IsOptional()
  @IsArray()
  motsCles?: string[];

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  siteWeb?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  photoCouverture?: string;

  @IsOptional()
  @IsArray()
  galeriePhotos?: string[];

  @IsOptional()
  @IsInt()
  dirigeantId?: number;
}