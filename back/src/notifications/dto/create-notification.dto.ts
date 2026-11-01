import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TypeNotificationEnum } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsInt()
  utilisateurId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(TypeNotificationEnum)
  type?: TypeNotificationEnum;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  lien?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icone?: string;
}

export class BroadcastNotificationDto {
  @IsNotEmpty()
  @IsArray()
  utilisateurIds: number[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  titre: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(TypeNotificationEnum)
  type?: TypeNotificationEnum;

  @IsOptional()
  @IsString()
  lien?: string;

  @IsOptional()
  @IsString()
  icone?: string;
}

export class BroadcastRoleDto {
  @IsNotEmpty()
  @IsString()
  role: 'ADMIN' | 'MENTOR' | 'DIRIGEANT';

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  titre: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(TypeNotificationEnum)
  type?: TypeNotificationEnum;

  @IsOptional()
  @IsString()
  lien?: string;
}