import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class EvaluerDemandeDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @IsOptional()
  @IsString()
  commentaireEvaluation?: string;
}