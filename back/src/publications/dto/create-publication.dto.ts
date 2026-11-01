import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  TypePublicationEnum,
  VisibilitePublicationEnum,
} from '../entities/publication.entity';

export class CreatePublicationDto {
  @IsNotEmpty()
  @IsInt()
  entrepriseId: number;

  @IsOptional()
  @IsEnum(TypePublicationEnum)
  type?: TypePublicationEnum;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre?: string;

  @IsNotEmpty()
  @IsString()
  contenu: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  fichier?: string;

  @IsOptional()
  @IsEnum(VisibilitePublicationEnum)
  visibilite?: VisibilitePublicationEnum;
}