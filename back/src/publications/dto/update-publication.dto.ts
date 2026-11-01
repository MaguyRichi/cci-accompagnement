import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicationDto } from './create-publication.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {
  @IsOptional()
  @IsBoolean()
  epingle?: boolean;
}