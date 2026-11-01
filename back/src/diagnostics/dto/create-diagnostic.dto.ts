import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class CreateDiagnosticDto {
  @IsInt()
  entrepriseId: number;

  @IsOptional()
  @IsBoolean()
  autoEvaluation?: boolean;  // true = fait par la PME, false = accompagné
}