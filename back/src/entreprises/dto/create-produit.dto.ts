import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProduitDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  nom: string;

  @IsOptional()
  @IsString()
  prix?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsString()
  image?: string;
}