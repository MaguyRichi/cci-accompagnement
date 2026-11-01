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

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';
import {
  CreateMessageDto,
  ProposerRdvDto,
  RepondreRdvDto,
} from './dto/create-message.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /* ============================================
     MES CONVERSATIONS
     ============================================ */

  @Get()
  @UseGuards(JwtAuthGuard)
  findMesConversations(
    @CurrentUser('id') userId: number,
    @Query() query: QueryConversationDto,
  ) {
    return this.conversationsService.findMesConversations(userId, query);
  }

  /* ============================================
     ADMIN STATS
     ============================================ */

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.conversationsService.getStats();
  }

  /* ============================================
     DÉTAIL
     ============================================ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.conversationsService.findOne(id, user);
  }

  /* ============================================
     CRÉATION + ARCHIVAGE
     ============================================ */

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateConversationDto, @CurrentUser() user: any) {
    return this.conversationsService.create(dto, user);
  }

  @Patch(':id/archiver')
  @UseGuards(JwtAuthGuard)
  archiver(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.conversationsService.archiver(id, user);
  }

  /* ============================================
     MESSAGES
     ============================================ */

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  findMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query() query: QueryConversationDto,
  ) {
    return this.conversationsService.findMessages(id, user, query);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  envoyerMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.envoyerMessage(id, dto, user);
  }

  @Patch(':id/lu')
  @UseGuards(JwtAuthGuard)
  marquerCommeLu(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.conversationsService.marquerCommeLu(id, user);
  }

  @Delete(':id/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  supprimerMessage(
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.supprimerMessage(id, messageId, user);
  }

  /* ============================================
     RDV DANS LE CHAT
     ============================================ */

  @Post(':id/rdv')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  proposerRdv(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProposerRdvDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.proposerRdv(id, dto, user);
  }

  @Patch(':id/rdv/:messageId')
  @UseGuards(JwtAuthGuard)
  repondreRdv(
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: RepondreRdvDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.repondreRdv(id, messageId, dto, user);
  }
}