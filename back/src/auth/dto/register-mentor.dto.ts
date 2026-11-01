import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RegisterMentorDto {
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

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  domaineMentor: string;

  @IsInt()
  @Min(0)
  experienceMentor: number;

  @IsNotEmpty()
  @IsString()
  bioMentor: string;

  @IsOptional()
  @IsString()
  disponibilite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  agrementMentor?: string;
}