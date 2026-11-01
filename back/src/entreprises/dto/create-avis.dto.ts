import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAvisDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @IsNotEmpty()
  @IsString()
  commentaire: string;

  @IsOptional()
  @IsString()
  auteurNom?: string;

  @IsOptional()
  @IsString()
  auteurPhoto?: string;
}