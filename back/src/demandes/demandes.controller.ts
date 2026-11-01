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

import { DemandesService } from './demandes.service';
import { CreateDemandeDto } from './dto/create-demande.dto';
import { UpdateDemandeDto } from './dto/update-demande.dto';
import { QueryDemandeDto } from './dto/query-demande.dto';
import {
  DemanderRdvDto,
  RefuserDemandeDto,
  TraiterDemandeDto,
} from './dto/traiter-demande.dto';
import { EvaluerDemandeDto } from './dto/evaluer-demande.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('demandes')
export class DemandesController {
  constructor(private readonly demandesService: DemandesService) {}

  /* ============================================
     ADMIN — Liste toutes les demandes
     ⚠️ AJOUTER 'ADMIN' DANS @Roles
     ============================================ */

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') // ⬅️ LE FIX EST ICI
  findAll(@Query() query: QueryDemandeDto) {
    return this.demandesService.findAll(query);
  }

  /* ============================================
     STATS
     ============================================ */

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.demandesService.getStats();
  }

  /* ============================================
     COLLABORATIONS PUBLIQUES (PUBLIC)
     ============================================ */

  @Get('collaborations-publiques')
  findCollaborationsPubliques(@Query() query: QueryDemandeDto) {
    return this.demandesService.findCollaborationsPubliques(query);
  }

  /* ============================================
     MES DEMANDES
     ============================================ */

  @Get('mes-demandes')
  @UseGuards(JwtAuthGuard)
  findMesDemandes(
    @CurrentUser('id') userId: number,
    @Query() query: QueryDemandeDto,
  ) {
    return this.demandesService.findMesDemandes(userId, query);
  }

  /* ============================================
     DEMANDES REÇUES
     ============================================ */

  @Get('recues')
  @UseGuards(JwtAuthGuard)
  findRecues(
    @CurrentUser('id') userId: number,
    @Query() query: QueryDemandeDto,
  ) {
    return this.demandesService.findRecues(userId, query);
  }

  /* ============================================
     DÉTAIL
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.demandesService.findOne(id, user);
  }

  /* ============================================
     CRÉER — Mentorat
     ============================================ */

  @Post('mentorat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createMentorat(@Body() dto: CreateDemandeDto, @CurrentUser() user: any) {
    return this.demandesService.createMentorat(dto, user);
  }

  /* ============================================
     CRÉER — Collaboration
     ============================================ */

  @Post('collaboration')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createCollaboration(@Body() dto: CreateDemandeDto, @CurrentUser() user: any) {
    return this.demandesService.createCollaboration(dto, user);
  }

  /* ============================================
     CRÉER — RDV
     ============================================ */

  @Post('rdv')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createRdv(@Body() dto: CreateDemandeDto, @CurrentUser() user: any) {
    return this.demandesService.createRdv(dto, user);
  }

  /* ============================================
     CRÉER — Générique
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDemandeDto, @CurrentUser() user: any) {
    return this.demandesService.create(dto, user);
  }

  /* ============================================
     MODIFIER
     ============================================ */

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDemandeDto,
    @CurrentUser() user: any,
  ) {
    return this.demandesService.update(id, dto, user);
  }

  /* ============================================
     ADMIN — Valider / Refuser / RDV
     ============================================ */

  @Patch(':id/valider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  valider(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TraiterDemandeDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.demandesService.valider(id, dto, adminId);
  }

  @Patch(':id/refuser')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  refuser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefuserDemandeDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.demandesService.refuser(id, dto, adminId);
  }

  @Patch(':id/rdv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  demanderRdv(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DemanderRdvDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.demandesService.demanderRdv(id, dto, adminId);
  }

  /* ============================================
     ACCEPTER / REFUSER par la cible
     ============================================ */

  @Patch(':id/accepter')
  @UseGuards(JwtAuthGuard)
  accepter(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.demandesService.accepter(id, user);
  }

  @Patch(':id/refuser-cible')
  @UseGuards(JwtAuthGuard)
  refuserParCible(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefuserDemandeDto,
    @CurrentUser() user: any,
  ) {
    return this.demandesService.refuserParCible(id, dto, user);
  }

  /* ============================================
     TERMINER / ANNULER / ÉVALUER
     ============================================ */

  @Patch(':id/terminer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MENTOR', 'DIRIGEANT')
  terminer(@Param('id', ParseIntPipe) id: number) {
    return this.demandesService.terminer(id);
  }

  @Patch(':id/annuler')
  @UseGuards(JwtAuthGuard)
  annuler(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.demandesService.annuler(id, user);
  }

  @Post(':id/evaluer')
  @UseGuards(JwtAuthGuard)
  evaluer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EvaluerDemandeDto,
    @CurrentUser() user: any,
  ) {
    return this.demandesService.evaluer(id, dto, user);
  }
}