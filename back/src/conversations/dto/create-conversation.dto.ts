import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TypeConversationEnum } from '../entities/conversation.entity';

export class CreateConversationDto {
  @IsNotEmpty()
  @IsEnum(TypeConversationEnum)
  type: TypeConversationEnum;

  @IsNotEmpty()
  @IsInt()
  destinataireId: number;

  @IsOptional()
  @IsInt()
  entrepriseAId?: number;

  @IsOptional()
  @IsInt()
  entrepriseBId?: number;

  @IsOptional()
  @IsInt()
  demandeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sujet?: string;

  @IsOptional()
  @IsString()
  premierMessage?: string;
}