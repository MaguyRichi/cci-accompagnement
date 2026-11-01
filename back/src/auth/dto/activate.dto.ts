import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  motDePasse: string;
}