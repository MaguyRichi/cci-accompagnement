import { IsNotEmpty, IsObject } from 'class-validator';
import { IsOptional } from 'class-validator';

export class SubmitDiagnosticDto {
  @IsNotEmpty()
  @IsObject()
  reponses: Record<string, any>;  // { [questionId]: valeur }

  @IsOptional()
  commentaire?: string;
}