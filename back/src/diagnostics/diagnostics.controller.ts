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

import { DiagnosticsService } from './diagnostics.service';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { SubmitDiagnosticDto } from './dto/submit-diagnostic.dto';
import { QueryDiagnosticDto } from './dto/query-diagnostic.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  /* ============================================
     QUESTIONS — PUBLIC
     ============================================ */

  @Get('questions')
  findAllQuestions(@Query('actif') actif?: string) {
    return this.diagnosticsService.findAllQuestions(actif !== 'false');
  }

  /* ============================================
     QUESTIONS — ADMIN
     ============================================ */

  @Get('questions/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllQuestionsAdmin() {
    return this.diagnosticsService.findAllQuestions(false);
  }

  @Get('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOneQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosticsService.findOneQuestion(id);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.diagnosticsService.createQuestion(dto);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.diagnosticsService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosticsService.deleteQuestion(id);
  }

  /* ============================================
     STATS PUBLIQUES
     ============================================ */

  @Get('repartition')
  getRepartition() {
    return this.diagnosticsService.getRepartition();
  }

  /* ============================================
     DIAGNOSTICS — DIRIGEANT
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDiagnosticDto,
    @CurrentUser() user: any,
  ) {
    return this.diagnosticsService.create(dto, user);
  }

  @Post(':id/soumettre')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitDiagnosticDto,
    @CurrentUser() user: any,
  ) {
    return this.diagnosticsService.submit(id, dto, user);
  }

  @Get('mes-diagnostics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT', 'ADMIN', 'MENTOR')
  findMesDiagnostics(
    @CurrentUser() user: any,
    @Query() query: QueryDiagnosticDto,
  ) {
    return this.diagnosticsService.findMesDiagnostics(user, query);
  }

  /* ============================================
     DIAGNOSTICS — ADMIN
     ============================================ */

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query() query: QueryDiagnosticDto) {
    return this.diagnosticsService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.diagnosticsService.getStats();
  }

  /* ============================================
     DÉTAIL + COMPARAISON
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.diagnosticsService.findOne(id, user);
  }

  @Get(':id/comparer')
  @UseGuards(JwtAuthGuard)
  comparer(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.diagnosticsService.comparer(id, user);
  }

  /* ============================================
     VALIDATION
     ============================================ */

  @Patch(':id/valider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  valider(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.diagnosticsService.valider(id, adminId);
  }
}