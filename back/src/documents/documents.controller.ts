import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /* ============================================
     PUBLIC — documents d'une entreprise
     ============================================ */

  @Get('entreprise/:entrepriseId')
  findByEntreprise(@Param('entrepriseId', ParseIntPipe) entrepriseId: number) {
    return this.documentsService.findByEntreprise(entrepriseId);
  }

  /* ============================================
     STATS ADMIN
     ============================================ */

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.documentsService.getStats();
  }

  /* ============================================
     LISTE
     ============================================ */

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: QueryDocumentDto, @CurrentUser() user: any) {
    return this.documentsService.findAll(query, user);
  }

  /* ============================================
     DÉTAIL
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user);
  }

  /* ============================================
     CRÉATION
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDocumentDto, @CurrentUser() user: any) {
    return this.documentsService.create(dto, user);
  }

  /* ============================================
     VALIDATION ADMIN
     ============================================ */

  @Patch(':id/valider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  valider(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.documentsService.valider(id, adminId);
  }

  @Patch(':id/rejeter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  rejeter(
    @Param('id', ParseIntPipe) id: number,
    @Body('motif') motif: string,
    @CurrentUser('id') adminId: number,
  ) {
    return this.documentsService.rejeter(id, motif, adminId);
  }

  /* ============================================
     SUPPRESSION
     ============================================ */

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.documentsService.remove(id, user);
  }
}