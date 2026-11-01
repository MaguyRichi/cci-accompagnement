import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* ============================================
     PUBLIC — Liste des mentors
     ============================================ */
  @Get('mentors')
  findMentors() {
    return this.usersService.findMentorsPublic();
  }

  /* ============================================
     AUTH — Contacts pour le chat
     ============================================ */
  @Get('chat/contacts')
  @UseGuards(JwtAuthGuard)
  findContactsForChat() {
    return this.usersService.findContactsForChat();
  }

  /* ============================================
     MON PROFIL — GET /users/me
     ============================================ */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser('id') userId: number) {
    return this.usersService.findOneSafe(userId);
  }

  /* ============================================
     MON PROFIL — PATCH /users/me
     (nom, prenom, telephone, photoProfil)
     ============================================ */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser('id') userId: number,
    @Body()
    dto: {
      nom?: string;
      prenom?: string;
      telephone?: string;
      photoProfil?: string;
      bioCourte?: string;
    },
  ) {
    return this.usersService.updateMe(userId, dto);
  }

  /* ============================================
     MON PROFIL — PATCH /users/me/photo
     ============================================ */
  @Patch('me/photo')
  @UseGuards(JwtAuthGuard)
  updateMyPhoto(
    @CurrentUser('id') userId: number,
    @Body('photoProfil') photoProfil: string,
  ) {
    return this.usersService.updateMe(userId, { photoProfil });
  }

  /* ============================================
     ADMIN — Tous les utilisateurs
     ============================================ */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneSafe(id);
  }

  /* ============================================
     ADMIN — Bannir / Réactiver
     ============================================ */
  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('motif') motif: string,
  ) {
    return this.usersService.banUser(id, motif);
  }

  @Patch(':id/unban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unbanUser(id);
  }

  /* ============================================
     ADMIN — Supprimer un utilisateur
     ============================================ */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}