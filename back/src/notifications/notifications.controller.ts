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

import { NotificationsService } from './notifications.service';
import {
  BroadcastNotificationDto,
  BroadcastRoleDto,
  CreateNotificationDto,
} from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /* ============================================
     MES NOTIFICATIONS
     ============================================ */

  @Get()
  @UseGuards(JwtAuthGuard)
  findMesNotifications(
    @CurrentUser('id') userId: number,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findMesNotifications(userId, query);
  }

  @Get('non-lues/count')
  @UseGuards(JwtAuthGuard)
  countNonLues(@CurrentUser('id') userId: number) {
    return this.notificationsService.countNonLues(userId);
  }

  /* ============================================
     ADMIN STATS
     ============================================ */

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.notificationsService.getStats();
  }

  /* ============================================
     DÉTAIL
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.findOne(id, user);
  }

  /* ============================================
     CRÉATION / BROADCAST (admin)
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }

  @Post('broadcast-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  broadcastByRole(@Body() dto: BroadcastRoleDto) {
    return this.notificationsService.broadcastByRole(dto);
  }

  /* ============================================
     MARQUER COMME LU
     ============================================ */

  @Patch('tout-lu')
  @UseGuards(JwtAuthGuard)
  toutMarquerCommeLu(@CurrentUser('id') userId: number) {
    return this.notificationsService.toutMarquerCommeLu(userId);
  }

  @Patch(':id/lu')
  @UseGuards(JwtAuthGuard)
  marquerCommeLue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.marquerCommeLue(id, user);
  }

  /* ============================================
     SUPPRESSION
     ============================================ */

  @Delete()
  @UseGuards(JwtAuthGuard)
  toutSupprimer(@CurrentUser('id') userId: number) {
    return this.notificationsService.toutSupprimer(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.remove(id, user);
  }
}