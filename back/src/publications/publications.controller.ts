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

import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { QueryPublicationDto } from './dto/query-publication.dto';
import { CreateCommentaireDto } from './dto/create-commentaire.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  /* ============================================
     ROUTES PUBLIQUES
     ============================================ */

  @Get('flux-public')
  findFluxPublic(@Query() query: QueryPublicationDto) {
    return this.publicationsService.findFluxPublic(query);
  }

  @Get('mur/:entrepriseId')
  findMurEntreprise(
    @Param('entrepriseId', ParseIntPipe) entrepriseId: number,
    @Query() query: QueryPublicationDto,
  ) {
    return this.publicationsService.findMurEntreprise(entrepriseId, query);
  }

  @Post(':id/vue')
  @HttpCode(HttpStatus.OK)
  incrementVues(@Param('id', ParseIntPipe) id: number) {
    return this.publicationsService.incrementVues(id);
  }

  /* ============================================
     MES PUBLICATIONS (dirigeant)
     ============================================ */

  @Get('mes-publications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  findMesPublications(
    @CurrentUser() user: any,
    @Query() query: QueryPublicationDto,
  ) {
    return this.publicationsService.findMesPublications(user, query);
  }

  /* ============================================
     ADMIN — STATS
     ============================================ */

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.publicationsService.getStats();
  }

  /* ============================================
     DÉTAIL
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.publicationsService.findOne(id, user);
  }

  /* ============================================
     CRÉATION / MODIFICATION / SUPPRESSION
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePublicationDto,
    @CurrentUser() user: any,
  ) {
    return this.publicationsService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicationDto,
    @CurrentUser() user: any,
  ) {
    return this.publicationsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.publicationsService.remove(id, user);
  }

  /* ============================================
     LIKE / COMMENTAIRES / ÉPINGLE
     ============================================ */

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.publicationsService.toggleLike(id, user);
  }

  @Post(':id/commentaires')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  ajouterCommentaire(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentaireDto,
    @CurrentUser() user: any,
  ) {
    return this.publicationsService.ajouterCommentaire(id, dto, user);
  }

  @Delete(':id/commentaires/:commentId')
  @UseGuards(JwtAuthGuard)
  supprimerCommentaire(
    @Param('id', ParseIntPipe) id: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser() user: any,
  ) {
    return this.publicationsService.supprimerCommentaire(id, commentId, user);
  }

  @Patch(':id/epingler')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  toggleEpingle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.publicationsService.toggleEpingle(id, user);
  }
}