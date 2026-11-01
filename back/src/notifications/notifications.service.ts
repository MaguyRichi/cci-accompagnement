import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import {
  Notification,
  TypeNotificationEnum,
} from "./entities/notification.entity";
import { User } from "../users/entities/user.entity";
import {
  BroadcastNotificationDto,
  BroadcastRoleDto,
  CreateNotificationDto,
} from "./dto/create-notification.dto";
import { QueryNotificationDto } from "./dto/query-notification.dto";
import { MailService } from "../mail/mail.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async findMesNotifications(userId: number, query: QueryNotificationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { utilisateurId: userId };
    if (query.type) where.type = query.type;
    if (query.lu === "true") where.lu = true;
    if (query.lu === "false") where.lu = false;
    if (query.q) where.titre = ILike(`%${query.q}%`);

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async countNonLues(userId: number) {
    const count = await this.notificationRepository.count({
      where: { utilisateurId: userId, lu: false },
    });
    return { count };
  }

  async findOne(id: number, user: any) {
    const notif = await this.notificationRepository.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Notification ${id} introuvable`);
    if (user.role !== "ADMIN" && notif.utilisateurId !== user.id) {
      throw new ForbiddenException("Accès refusé");
    }
    return notif;
  }

  async create(dto: CreateNotificationDto) {
    const notif = this.notificationRepository.create({
      utilisateurId: dto.utilisateurId,
      titre: dto.titre || null,
      message: dto.message || null,
      type: dto.type || TypeNotificationEnum.INFO,
      lien: dto.lien || null,
      icone: dto.icone || null,
    });

    const saved = await this.notificationRepository.save(notif);

    // Envoi email automatique
    try {
      const user = await this.userRepository.findOne({
        where: { id: dto.utilisateurId },
      });

      if (user && user.notifEmail && user.email) {
        await this.mailService.sendNotificationEmail(
          user.email,
          dto.titre || "Nouvelle notification",
          dto.message || "",
          dto.lien,
        );

        saved.emailEnvoye = true;
        saved.emailEnvoyeAt = new Date();
        await this.notificationRepository.save(saved);
      }
    } catch (err) {
      this.logger.error("Erreur envoi email notification:", err);
    }

    return saved;
  }

  async broadcast(dto: BroadcastNotificationDto) {
    const notifications: Notification[] = dto.utilisateurIds.map((uid) =>
      this.notificationRepository.create({
        utilisateurId: uid,
        titre: dto.titre,
        message: dto.message,
        type: dto.type || TypeNotificationEnum.INFO,
        lien: dto.lien || null,
        icone: dto.icone || null,
      }),
    );

    const saved = await this.notificationRepository.save(notifications);

    for (const notif of saved) {
      try {
        const user = await this.userRepository.findOne({
          where: { id: notif.utilisateurId },
        });
        if (user && user.notifEmail) {
          await this.mailService.sendNotificationEmail(
            user.email,
            dto.titre,
            dto.message,
            dto.lien,
          );
          notif.emailEnvoye = true;
          notif.emailEnvoyeAt = new Date();
          await this.notificationRepository.save(notif);
        }
      } catch (err) {
        this.logger.error(`Erreur email broadcast user ${notif.utilisateurId}`);
      }
    }

    return {
      message: `${saved.length} notifications envoyées`,
      count: saved.length,
    };
  }

  async broadcastByRole(dto: BroadcastRoleDto) {
    const users = await this.userRepository.find({
      where: { role: dto.role as any, actif: true },
      select: ["id"],
    });

    if (users.length === 0) {
      return { message: "Aucun utilisateur trouvé pour ce rôle", count: 0 };
    }

    const notifications: Notification[] = users.map((u) =>
      this.notificationRepository.create({
        utilisateurId: u.id,
        titre: dto.titre,
        message: dto.message,
        type: dto.type || TypeNotificationEnum.INFO,
        lien: dto.lien || null,
      }),
    );

    const saved = await this.notificationRepository.save(notifications);

    for (const notif of saved) {
      try {
        const user = await this.userRepository.findOne({
          where: { id: notif.utilisateurId },
        });
        if (user && user.notifEmail) {
          await this.mailService.sendNotificationEmail(
            user.email,
            dto.titre,
            dto.message,
            dto.lien,
          );
          notif.emailEnvoye = true;
          notif.emailEnvoyeAt = new Date();
          await this.notificationRepository.save(notif);
        }
      } catch (err) {
        this.logger.error(`Erreur email broadcast role`);
      }
    }

    return {
      message: `${saved.length} notifications envoyées au rôle ${dto.role}`,
      count: saved.length,
    };
  }

  async marquerCommeLue(id: number, user: any) {
    const notif = await this.findOne(id, user);
    if (notif.lu) return notif;
    notif.lu = true;
    notif.luAt = new Date();
    return this.notificationRepository.save(notif);
  }

  async toutMarquerCommeLu(userId: number) {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ lu: true, luAt: new Date() })
      .where("utilisateurId = :uid", { uid: userId })
      .andWhere("lu = false")
      .execute();

    return { message: "Toutes les notifications ont été marquées comme lues" };
  }

  async remove(id: number, user: any) {
    const notif = await this.findOne(id, user);
    await this.notificationRepository.remove(notif);
    return { message: "Notification supprimée" };
  }

  async toutSupprimer(userId: number) {
    await this.notificationRepository.delete({ utilisateurId: userId });
    return { message: "Toutes les notifications ont été supprimées" };
  }

  async getStats() {
    const total = await this.notificationRepository.count();
    const nonLues = await this.notificationRepository.count({
      where: { lu: false },
    });
    const lues = await this.notificationRepository.count({
      where: { lu: true },
    });
    const emailEnvoyes = await this.notificationRepository.count({
      where: { emailEnvoye: true },
    });

    return { total, nonLues, lues, emailEnvoyes };
  }
}