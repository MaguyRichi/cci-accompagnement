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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { EntreprisesService } from './entreprises.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';
import { QueryEntrepriseDto } from './dto/query-entreprise.dto';
import { QueryAnnuaireDto } from './dto/query-annuaire.dto';
import { CreateAvisDto } from './dto/create-avis.dto';
import { CreateProduitDto } from './dto/create-produit.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('entreprises')
export class EntreprisesController {
  constructor(private readonly entreprisesService: EntreprisesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN', 'MENTOR')
  getMyEntreprise(@CurrentUser('id') userId: number) {
    return this.entreprisesService.getMyEntreprise(userId);
  }

  @Get('annuaire')
  findAnnuaire(@Query() query: QueryAnnuaireDto) {
    return this.entreprisesService.findAnnuaire(query);
  }

  @Get('annuaire/stats')
  getAnnuaireStats() {
    return this.entreprisesService.getAnnuaireStats();
  }

  @Get('annuaire/export.csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async exportCsv(@Res() res: Response) {
    const data = await this.entreprisesService.findAnnuaire({
      page: 1,
      limit: 10000,
    } as any);

    const rows = data.data;

    const headers = [
      'Raison sociale',
      'Sigle',
      'NIF',
      'STAT',
      'Secteur',
      'Ville',
      'Région',
      'Adresse',
      'Téléphone',
      'Email',
      'Site web',
      'Effectif',
      'Taille',
      'Vérifiée',
    ];

    const csvRows = [
      headers.join(';'),
      ...rows.map((e: any) =>
        [
          `"${e.raisonSociale || ''}"`,
          `"${e.sigle || ''}"`,
          `"${e.nif || ''}"`,
          `"${e.stat || ''}"`,
          `"${e.secteur || ''}"`,
          `"${e.ville || ''}"`,
          `"${e.region || ''}"`,
          `"${e.adresse || ''}"`,
          `"${e.telephone || ''}"`,
          `"${e.email || ''}"`,
          `"${e.siteWeb || ''}"`,
          e.effectif || '',
          `"${e.taille || ''}"`,
          e.verifie ? 'Oui' : 'Non',
        ].join(';'),
      ),
    ];

    const csv = '\uFEFF' + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="annuaire-cci-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Get('public')
  findAllPublic(@Query() query: QueryEntrepriseDto) {
    return this.entreprisesService.findAll(query);
  }

  @Get('public/stats')
  getStats() {
    return this.entreprisesService.getStatsPubliques();
  }

  @Get('public/top')
  getTop(@Query('limit') limit?: string) {
    return this.entreprisesService.getTopPme(limit ? parseInt(limit, 10) : 6);
  }

  @Get('public/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.entreprisesService.findOne(id, true);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEntrepriseDto, @CurrentUser('id') userId: number) {
    return this.entreprisesService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEntrepriseDto,
    @CurrentUser() user: any,
  ) {
    return this.entreprisesService.update(id, dto, user);
  }

  @Post(':id/avis')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  ajouterAvis(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAvisDto,
    @CurrentUser() user: any,
  ) {
    return this.entreprisesService.ajouterAvis(id, dto, user);
  }

  @Post(':id/produits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  ajouterProduit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProduitDto,
    @CurrentUser() user: any,
  ) {
    return this.entreprisesService.ajouterProduit(id, dto, user);
  }

  // ✅ NOUVEAU : mise à jour d'un produit
  @Patch(':id/produits/:index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  modifierProduit(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @Body() dto: CreateProduitDto,
    @CurrentUser() user: any,
  ) {
    return this.entreprisesService.modifierProduit(id, index, dto, user);
  }

  @Delete(':id/produits/:index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  supprimerProduit(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() user: any,
  ) {
    return this.entreprisesService.supprimerProduit(id, index, user);
  }

  @Patch(':id/verifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  verifier(@Param('id', ParseIntPipe) id: number) {
    return this.entreprisesService.verifier(id);
  }

  @Patch(':id/suspendre')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  suspendre(
    @Param('id', ParseIntPipe) id: number,
    @Body('motif') motif: string,
  ) {
    return this.entreprisesService.suspendre(id, motif);
  }

  @Patch(':id/reactiver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reactiver(@Param('id', ParseIntPipe) id: number) {
    return this.entreprisesService.reactiver(id);
  }

  @Patch(':id/mentor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  assignerMentor(
    @Param('id', ParseIntPipe) id: number,
    @Body('mentorId', ParseIntPipe) mentorId: number,
  ) {
    return this.entreprisesService.assignerMentor(id, mentorId);
  }

  @Delete(':id/mentor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  retirerMentor(@Param('id', ParseIntPipe) id: number) {
    return this.entreprisesService.retirerMentor(id);
  }

  @Delete(':id/avis/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  supprimerAvis(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.entreprisesService.supprimerAvis(id, userId);
  }
}