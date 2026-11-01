import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import {
  Conversation,
  StatutConversationEnum,
  TypeConversationEnum,
} from './entities/conversation.entity';
import {
  Message,
  StatutRdvMessageEnum,
  TypeMessageEnum,
} from '../messages/entities/message.entity';
import { User } from '../users/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { QueryConversationDto } from './dto/query-conversation.dto';
import {
  CreateMessageDto,
  ProposerRdvDto,
  RepondreRdvDto,
} from './dto/create-message.dto';

import { NotificationsService } from '../notifications/notifications.service';
import { TypeNotificationEnum } from '../notifications/entities/notification.entity';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /* ============================================
     UTIL — notification silencieuse
     ============================================ */
  private async safeNotify(payload: {
    utilisateurId: number;
    titre: string;
    message: string;
    type: TypeNotificationEnum;
    lien?: string;
    icone?: string;
  }) {
    try {
      await this.notificationsService.create(payload as any);
    } catch (err) {
      this.logger.error(
        `Erreur notification user ${payload.utilisateurId}: ${err}`,
      );
    }
  }

  /**
   * Récupère l'id de l'autre participant de la conversation
   */
  private getDestinataireId(conv: Conversation, userId: number): number | null {
    if (conv.demandeurId === userId) return conv.destinataireId;
    if (conv.destinataireId === userId) return conv.demandeurId;
    return null;
  }

  /**
   * Anti-spam : ne pas envoyer 10 notifs si 10 messages d'affilée.
   * On vérifie la dernière notif MESSAGE du destinataire.
   */
  private async shouldNotifyMessage(destinataireId: number): Promise<boolean> {
    try {
      const res = await this.notificationsService.findMesNotifications(
        destinataireId,
        { type: TypeNotificationEnum.MESSAGE, limit: 1 } as any,
      );
      const last = res?.data?.[0];
      if (!last) return true;
      const minutesSince =
        (Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60);
      return minutesSince > 5;
    } catch {
      return true;
    }
  }

  /* ============================================
     LISTE MES CONVERSATIONS
     ============================================ */
  async findMesConversations(userId: number, query: QueryConversationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.demandeur', 'demandeur')
      .leftJoinAndSelect('c.destinataire', 'destinataire')
      .leftJoinAndSelect('c.entrepriseA', 'entrepriseA')
      .leftJoinAndSelect('c.entrepriseB', 'entrepriseB')
      .where('(c.demandeurId = :uid OR c.destinataireId = :uid)', {
        uid: userId,
      });

    if (query.type) qb.andWhere('c.type = :type', { type: query.type });
    if (query.statut) qb.andWhere('c.statut = :statut', { statut: query.statut });

    qb.orderBy('c.dernierMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     DÉTAIL D'UNE CONVERSATION
     ============================================ */
  async findOne(id: number, user: any) {
    const conv = await this.conversationRepository.findOne({
      where: { id },
      relations: ['demandeur', 'destinataire', 'entrepriseA', 'entrepriseB'],
    });

    if (!conv) {
      throw new NotFoundException(`Conversation ${id} introuvable`);
    }

    if (
      user.role !== 'ADMIN' &&
      conv.demandeurId !== user.id &&
      conv.destinataireId !== user.id
    ) {
      throw new ForbiddenException("Vous n'êtes pas participant");
    }

    return conv;
  }

  /* ============================================
     CRÉER CONVERSATION
     ============================================ */
  async create(dto: CreateConversationDto, user: any) {
    if (dto.destinataireId === user.id) {
      throw new BadRequestException(
        'Vous ne pouvez pas démarrer une conversation avec vous-même',
      );
    }

    const destinataire = await this.userRepository.findOne({
      where: { id: dto.destinataireId },
    });
    if (!destinataire) {
      throw new NotFoundException(
        `Destinataire ${dto.destinataireId} introuvable`,
      );
    }

    // Vérifier si une conversation active existe déjà
    const existing = await this.conversationRepository
      .createQueryBuilder('c')
      .where('c.type = :type', { type: dto.type })
      .andWhere(
        '((c.demandeurId = :uid AND c.destinataireId = :dest) OR (c.demandeurId = :dest AND c.destinataireId = :uid))',
        { uid: user.id, dest: dto.destinataireId },
      )
      .andWhere('c.statut = :statut', { statut: StatutConversationEnum.ACTIVE })
      .getOne();

    if (existing) {
      return existing;
    }

    const conv = this.conversationRepository.create({
      type: dto.type,
      demandeurId: user.id,
      destinataireId: dto.destinataireId,
      entrepriseAId: dto.entrepriseAId || null,
      entrepriseBId: dto.entrepriseBId || null,
      demandeId: dto.demandeId || null,
      sujet: dto.sujet || null,
      statut: StatutConversationEnum.ACTIVE,
      nbNonLusA: 0,
      nbNonLusB: 0,
    } as unknown as Conversation);

    const saved = await this.conversationRepository.save(conv);

    // Envoyer le premier message si fourni
    if (dto.premierMessage) {
      await this.envoyerMessage(
        saved.id,
        { contenu: dto.premierMessage, type: TypeMessageEnum.TEXTE },
        user,
      );
    }

    return this.conversationRepository.findOne({
      where: { id: saved.id },
      relations: ['demandeur', 'destinataire', 'entrepriseA', 'entrepriseB'],
    });
  }

  /* ============================================
     ARCHIVER / DÉSARCHIVER
     ============================================ */
  async archiver(id: number, user: any) {
    const conv = await this.findOne(id, user);

    conv.statut =
      conv.statut === StatutConversationEnum.ACTIVE
        ? StatutConversationEnum.ARCHIVEE
        : StatutConversationEnum.ACTIVE;

    return this.conversationRepository.save(conv);
  }

  /* ============================================
     MESSAGES D'UNE CONVERSATION
     ============================================ */
  async findMessages(id: number, user: any, query: QueryConversationDto) {
    await this.findOne(id, user);

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await this.messageRepository.findAndCount({
      where: { conversationId: id },
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
      relations: ['expediteur'],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     ENVOYER MESSAGE
     ============================================ */
  async envoyerMessage(id: number, dto: CreateMessageDto, user: any) {
    const conv = await this.findOne(id, user);

    if (conv.statut === StatutConversationEnum.ARCHIVEE) {
      throw new BadRequestException(
        'Cette conversation est archivée. Désarchivez-la pour envoyer un message.',
      );
    }

    if (!dto.contenu && !dto.fichier && !dto.image) {
      throw new BadRequestException('Message vide');
    }

    const message = this.messageRepository.create({
      conversationId: id,
      expediteurId: user.id,
      type: dto.type || TypeMessageEnum.TEXTE,
      contenu: dto.contenu || null,
      fichier: dto.fichier || null,
      image: dto.image || null,
      lu: false,
    } as any);

    const saved = await this.messageRepository.save(message);

    // Mise à jour de l'aperçu + compteur non lus + date dernier message
    conv.dernierMessage = dto.contenu
      ? dto.contenu.substring(0, 100)
      : dto.image
        ? '📷 Image'
        : dto.fichier
          ? '📎 Fichier'
          : 'Nouveau message';
    conv.dernierMessageAt = new Date();

    const isDemandeur = conv.demandeurId === user.id;
    if (isDemandeur) {
      conv.nbNonLusB = (conv.nbNonLusB || 0) + 1;
    } else {
      conv.nbNonLusA = (conv.nbNonLusA || 0) + 1;
    }

    await this.conversationRepository.save(conv);

    // 🔔 Notifier le destinataire (avec throttle 5 min)
    const destinataireId = this.getDestinataireId(conv, user.id);
    if (destinataireId && (await this.shouldNotifyMessage(destinataireId))) {
      const apercu = dto.contenu
        ? dto.contenu.substring(0, 60) +
          (dto.contenu.length > 60 ? '…' : '')
        : dto.image
          ? '📷 Image'
          : '📎 Fichier';

      const nomExpediteur =
        (user as any)?.prenom && (user as any)?.nom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as any)?.email || 'Un utilisateur';

      await this.safeNotify({
        utilisateurId: destinataireId,
        titre: '💬 Nouveau message',
        message: `${nomExpediteur} : ${apercu}`,
        type: TypeNotificationEnum.MESSAGE,
        lien: `/pme/messages?conversation=${id}`,
        icone: 'message',
      });
    }

    return saved;
  }

  /* ============================================
     MARQUER COMME LU
     ============================================ */
  async marquerCommeLu(id: number, user: any) {
    const conv = await this.findOne(id, user);

    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ lu: true, luAt: new Date() })
      .where('conversationId = :id', { id })
      .andWhere('expediteurId != :uid', { uid: user.id })
      .andWhere('lu = false')
      .execute();

    if (conv.demandeurId === user.id) {
      conv.nbNonLusA = 0;
    } else {
      conv.nbNonLusB = 0;
    }
    await this.conversationRepository.save(conv);

    return { message: 'Messages marqués comme lus' };
  }

  /* ============================================
     PROPOSER RDV (dans le chat)
     ============================================ */
  async proposerRdv(id: number, dto: ProposerRdvDto, user: any) {
    const conv = await this.findOne(id, user);

    const message = this.messageRepository.create({
      conversationId: id,
      expediteurId: user.id,
      type: TypeMessageEnum.RDV,
      contenu: dto.contenu || `Proposition de RDV le ${dto.dateRdv}`,
      dateRdv: new Date(dto.dateRdv),
      lieuRdv: dto.lieuRdv || null,
      rdvStatut: StatutRdvMessageEnum.PROPOSE,
      lu: false,
    } as any);

    const saved = await this.messageRepository.save(message);

    conv.dernierMessage = ` Proposition de RDV`;
    conv.dernierMessageAt = new Date();

    const isDemandeur = conv.demandeurId === user.id;
    if (isDemandeur) {
      conv.nbNonLusB = (conv.nbNonLusB || 0) + 1;
    } else {
      conv.nbNonLusA = (conv.nbNonLusA || 0) + 1;
    }

    await this.conversationRepository.save(conv);

    // 🔔 Notifier le destinataire
    const destinataireId = this.getDestinataireId(conv, user.id);
    if (destinataireId) {
      const dateTxt = new Date(dto.dateRdv).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const nomExpediteur =
        (user as any)?.prenom && (user as any)?.nom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as any)?.email || 'Un utilisateur';

      await this.safeNotify({
        utilisateurId: destinataireId,
        titre: ' Proposition de rendez-vous',
        message: `${nomExpediteur} vous propose un RDV le ${dateTxt}.`,
        type: TypeNotificationEnum.RDV,
        lien: `/pme/messages?conversation=${id}`,
        icone: 'calendar',
      });
    }

    return saved;
  }

  /* ============================================
     RÉPONDRE AU RDV (accepter / refuser)
     ============================================ */
  async repondreRdv(
    id: number,
    messageId: number,
    dto: RepondreRdvDto,
    user: any,
  ) {
    const conv = await this.findOne(id, user);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId: id },
    });
    if (!message) {
      throw new NotFoundException(`Message ${messageId} introuvable`);
    }

    if (message.type !== TypeMessageEnum.RDV) {
      throw new BadRequestException(
        "Ce message n'est pas une proposition de RDV",
      );
    }

    message.rdvStatut =
      dto.statut === 'ACCEPTE'
        ? StatutRdvMessageEnum.ACCEPTE
        : StatutRdvMessageEnum.REFUSE;

    const saved = await this.messageRepository.save(message);

    // 🔔 Notifier l'auteur de la proposition
    if (message.expediteurId && message.expediteurId !== user.id) {
      const nomRepondeur =
        (user as any)?.prenom && (user as any)?.nom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as any)?.email || 'Un utilisateur';

      const accepted = dto.statut === 'ACCEPTE';

      await this.safeNotify({
        utilisateurId: message.expediteurId,
        titre: accepted ? ' RDV accepté' : ' RDV refusé',
        message: `${nomRepondeur} a ${accepted ? 'accepté' : 'refusé'} votre proposition de rendez-vous.`,
        type: accepted
          ? TypeNotificationEnum.VALIDATION
          : TypeNotificationEnum.ALERTE,
        lien: `/pme/messages?conversation=${id}`,
        icone: accepted ? 'check' : 'alert',
      });
    }

    return saved;
  }

  /* ============================================
     SUPPRIMER MESSAGE
     ============================================ */
  async supprimerMessage(
    conversationId: number,
    messageId: number,
    user: any,
  ) {
    await this.findOne(conversationId, user);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, conversationId },
    });
    if (!message) {
      throw new NotFoundException(`Message ${messageId} introuvable`);
    }

    if (user.role !== 'ADMIN' && message.expediteurId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce message');
    }

    await this.messageRepository.remove(message);
    return { message: 'Message supprimé' };
  }

  /* ============================================
     STATISTIQUES ADMIN
     ============================================ */
  async getStats() {
    const totalConv = await this.conversationRepository.count();
    const active = await this.conversationRepository.count({
      where: { statut: StatutConversationEnum.ACTIVE },
    });
    const archivees = await this.conversationRepository.count({
      where: { statut: StatutConversationEnum.ARCHIVEE },
    });
    const totalMessages = await this.messageRepository.count();

    return {
      totalConversations: totalConv,
      conversationsActives: active,
      conversationsArchivees: archivees,
      totalMessages,
    };
  }
}