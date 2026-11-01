import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentaireDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  contenu: string;
}