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

import { FpdService } from './fpd.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import {
  QueryInscriptionsFPDDto,
  QuerySessionsFPDDto,
} from './dto/query-fpd.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('fpd')
export class FpdController {
  constructor(private readonly fpdService: FpdService) {}

  /* ============================================
     SESSIONS
     ============================================ */

  @Get('sessions/public')
  findSessionsPublic() {
    return this.fpdService.findSessionsPublic();
  }

  @Get('sessions/mes-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT')
  findMesSessionsDirigeant(@CurrentUser('id') userId: number) {
    return this.fpdService.findMesSessionsDirigeant(userId);
  }

  @Get('sessions/mentor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  findSessionsMentor(@CurrentUser('id') mentorId: number) {
    return this.fpdService.findSessionsMentor(mentorId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findSessions(@Query() query: QuerySessionsFPDDto) {
    return this.fpdService.findSessions(query);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  findOneSession(@Param('id', ParseIntPipe) id: number) {
    return this.fpdService.findOneSession(id);
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MENTOR')
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body() dto: CreateSessionDto, @CurrentUser() user: any) {
    return this.fpdService.createSession(dto, user);
  }

  @Patch('sessions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MENTOR')
  updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.fpdService.updateSession(id, dto);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MENTOR')
  deleteSession(@Param('id', ParseIntPipe) id: number) {
    return this.fpdService.deleteSession(id);
  }

  /* ============================================
     MODULES & QUIZ
     ============================================ */

  @Post('modules/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  createModule(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() data: any,
    @CurrentUser('id') mentorId: number,
  ) {
    return this.fpdService.createModule(sessionId, mentorId, data);
  }

  @Get('modules/:sessionId')
  @UseGuards(JwtAuthGuard)
  getModules(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.fpdService.getModulesWithQuizzes(sessionId);
  }

  @Post('quizzes/:moduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  createQuiz(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() data: any,
    @CurrentUser('id') mentorId: number,
  ) {
    return this.fpdService.createQuiz(moduleId, mentorId, data);
  }

  // ✅ NOUVEAU : mise à jour d'un quiz
  @Patch('quizzes/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  updateQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() data: any,
    @CurrentUser('id') mentorId: number,
  ) {
    return this.fpdService.updateQuiz(quizId, mentorId, data);
  }

  // ✅ NOUVEAU : suppression d'un quiz
  @Delete('quizzes/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  deleteQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @CurrentUser('id') mentorId: number,
  ) {
    return this.fpdService.deleteQuiz(quizId, mentorId);
  }

  /* ============================================
     INSCRIPTIONS
     ============================================ */

  @Post('inscriptions/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT')
  @HttpCode(HttpStatus.CREATED)
  inscrire(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentUser() user: any,
  ) {
    return this.fpdService.inscrireDirigeant(sessionId, user);
  }

  @Get('mes-inscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT')
  findMesInscriptions(@CurrentUser('id') userId: number) {
    return this.fpdService.findMesInscriptions(userId);
  }

  @Post('inscriptions/:inscriptionId/quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DIRIGEANT')
  submitQuiz(
    @Param('inscriptionId', ParseIntPipe) inscriptionId: number,
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body('reponseIndex') reponseIndex: number,
  ) {
    return this.fpdService.submitQuizAnswer(inscriptionId, quizId, reponseIndex);
  }

  /* ============================================
     MENTOR
     ============================================ */

  @Get('mentorats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  findMentorats(@CurrentUser('id') mentorId: number) {
    return this.fpdService.findInscriptionsPourMentor(mentorId);
  }

  @Patch('inscriptions/:id/valider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MENTOR')
  validerParMentor(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: number,
    @Body('commentaire') commentaire: string | undefined,
    @CurrentUser('id') mentorId: number,
  ) {
    return this.fpdService.validerParMentor(
      id,
      Number(note),
      commentaire,
      mentorId,
    );
  }

  /* ============================================
     ADMIN
     ============================================ */

  @Get('inscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllInscriptions(@Query() query: QueryInscriptionsFPDDto) {
    return this.fpdService.findAllInscriptions(query);
  }

  @Get('inscriptions/:id')
  @UseGuards(JwtAuthGuard)
  findOneInscription(@Param('id', ParseIntPipe) id: number) {
    return this.fpdService.findOneInscription(id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.fpdService.getStats();
  }
}