import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import {
  Demande,
  StatutDemandeEnum,
  TypeDemandeEnum,
} from "./entities/demande.entity";
import { CreateDemandeDto } from "./dto/create-demande.dto";
import { UpdateDemandeDto } from "./dto/update-demande.dto";
import { QueryDemandeDto } from "./dto/query-demande.dto";
import {
  DemanderRdvDto,
  RefuserDemandeDto,
  TraiterDemandeDto,
} from "./dto/traiter-demande.dto";
import { EvaluerDemandeDto } from "./dto/evaluer-demande.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { TypeNotificationEnum } from "../notifications/entities/notification.entity";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class DemandesService {
  private readonly logger = new Logger(DemandesService.name);

  constructor(
    @InjectRepository(Demande)
    private readonly demandeRepository: Repository<Demande>,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
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

  /* ============================================
     CRÉATION GÉNÉRIQUE
     ============================================ */
  async create(dto: CreateDemandeDto, user: any): Promise<Demande> {
    const existing = await this.demandeRepository.findOne({
      where: {
        emetteurId: user.id,
        type: dto.type,
        statut: StatutDemandeEnum.EN_ATTENTE,
      },
    });

    if (existing && dto.type !== TypeDemandeEnum.COLLABORATION) {
      throw new BadRequestException(
        "Vous avez déjà une demande en attente de ce type",
      );
    }

    const demande = this.demandeRepository.create({
      ...dto,
      dateSouhaitee: dto.dateSouhaitee ? new Date(dto.dateSouhaitee) : null,
      emetteurId: user.id,
      statut: StatutDemandeEnum.EN_ATTENTE,
      visiblePubliquement:
        dto.type === TypeDemandeEnum.COLLABORATION
          ? dto.visiblePubliquement ?? true
          : false,
      datePublication:
        dto.type === TypeDemandeEnum.COLLABORATION && dto.visiblePubliquement
          ? new Date()
          : null,
    } as any);

    const saved = await this.demandeRepository.save(demande);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async createMentorat(dto: CreateDemandeDto, user: any) {
    if (!dto.cibleId) {
      throw new BadRequestException("Le mentor cible est obligatoire");
    }
    const saved = await this.create(
      { ...dto, type: TypeDemandeEnum.MENTORAT },
      user,
    );

    if (saved.cibleId) {
      const nomEmetteur =
        (user as any)?.prenom && (user as any)?.nom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as any)?.email || "Un dirigeant";

      await this.safeNotify({
        utilisateurId: saved.cibleId,
        titre: "Nouvelle demande de mentorat",
        message: `${nomEmetteur} souhaite bénéficier de votre accompagnement : "${
          (saved as any).titre || "Demande de mentorat"
        }".`,
        type: TypeNotificationEnum.MENTORAT,
        lien: "/pme/mentorat",
        icone: "mentorat",
      });
    }

    return saved;
  }

  async createCollaboration(dto: CreateDemandeDto, user: any) {
    return this.create(
      {
        ...dto,
        type: TypeDemandeEnum.COLLABORATION,
        visiblePubliquement: dto.visiblePubliquement ?? true,
      },
      user,
    );
  }

  async createRdv(dto: CreateDemandeDto, user: any) {
    return this.create({ ...dto, type: TypeDemandeEnum.RDV }, user);
  }

  /* ============================================
     LISTE GÉNÉRALE (admin)
     ============================================ */
  async findAll(query: QueryDemandeDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.statut) where.statut = query.statut;
    if (query.secteur) where.secteurConcerne = query.secteur;

    let whereConditions: any[] = [where];
    if (query.q) {
      whereConditions = [
        { ...where, titre: ILike(`%${query.q}%`) },
        { ...where, description: ILike(`%${query.q}%`) },
      ];
    }

    const [items, total] = await this.demandeRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["emetteur", "entreprise", "cible", "cibleEntreprise"],
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ============================================
     MES DEMANDES
     ============================================ */
  async findMesDemandes(userId: number, query: QueryDemandeDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { emetteurId: userId };
    if (query.type) where.type = query.type;
    if (query.statut) where.statut = query.statut;

    const [items, total] = await this.demandeRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["entreprise", "cible", "cibleEntreprise"],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     DEMANDES REÇUES
     ============================================ */
  async findRecues(userId: number, query: QueryDemandeDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { cibleId: userId };
    if (query.type) where.type = query.type;
    if (query.statut) where.statut = query.statut;

    const [items, total] = await this.demandeRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["emetteur", "entreprise", "cibleEntreprise"],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     COLLABORATIONS PUBLIQUES
     ============================================ */
  async findCollaborationsPubliques(query: QueryDemandeDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      type: TypeDemandeEnum.COLLABORATION,
      visiblePubliquement: true,
      statut: StatutDemandeEnum.EN_ATTENTE,
    };
    if (query.secteur) where.secteurConcerne = query.secteur;
    if (query.q) where.titre = ILike(`%${query.q}%`);

    const [items, total] = await this.demandeRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["entreprise"],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     DÉTAIL
     ============================================ */
  async findOne(id: number, user: any) {
    const demande = await this.demandeRepository.findOne({
      where: { id },
      relations: ["emetteur", "entreprise", "cible", "cibleEntreprise"],
    });

    if (!demande) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }

    const isAuthorized =
      user.role === "ADMIN" ||
      demande.emetteurId === user.id ||
      demande.cibleId === user.id;

    if (!isAuthorized) {
      throw new ForbiddenException("Accès refusé à cette demande");
    }

    return demande;
  }

  /* ============================================
     MISE À JOUR
     ============================================ */
  async update(id: number, dto: UpdateDemandeDto, user: any) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (user.role !== "ADMIN" && demande.emetteurId !== user.id) {
      throw new ForbiddenException("Vous ne pouvez pas modifier cette demande");
    }

    if (demande.statut !== StatutDemandeEnum.EN_ATTENTE) {
      throw new BadRequestException(
        "Seules les demandes en attente peuvent être modifiées",
      );
    }

    Object.assign(demande, dto);
    return this.demandeRepository.save(demande);
  }

  /* ============================================
     VALIDER (admin) — active + email
     ============================================ */
  async valider(id: number, dto: TraiterDemandeDto, adminId: number) {
    const demande = await this.demandeRepository.findOne({
      where: { id },
      relations: ["emetteur", "entreprise"],
    });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.statut !== StatutDemandeEnum.EN_ATTENTE) {
      throw new BadRequestException("Cette demande n'est plus en attente");
    }

    demande.statut = StatutDemandeEnum.VALIDEE;
    demande.traiteParId = adminId;
    demande.dateTraitement = new Date();

    // ✅ ACTIVER L'UTILISATEUR
    if (demande.emetteurId) {
      await this.demandeRepository.manager
        .createQueryBuilder()
        .update("utilisateurs")
        .set({ actif: true })
        .where("id = :id", { id: demande.emetteurId })
        .execute();
    }

    // ✅ ACTIVER L'ENTREPRISE
    if (
      demande.type === TypeDemandeEnum.INSCRIPTION_DIRIGEANT &&
      demande.entrepriseId
    ) {
      await this.demandeRepository.manager
        .createQueryBuilder()
        .update("entreprises")
        .set({ statut: "ACTIF" })
        .where("id = :id", { id: demande.entrepriseId })
        .execute();
    }

    const saved = await this.demandeRepository.save(demande);

    if (saved.emetteurId) {
      await this.safeNotify({
        utilisateurId: saved.emetteurId,
        titre: "Demande validée",
        message: `Votre demande "${
          (saved as any).titre || ""
        }" a été validée par la CCI. Consultez votre email pour créer votre mot de passe.`,
        type: TypeNotificationEnum.VALIDATION,
        lien: "/connexion",
        icone: "check",
      });

      try {
        await this.authService.envoyerEmailActivation(saved.emetteurId);
        this.logger.log(
          `✅ Email d'activation envoyé au user ${saved.emetteurId}`,
        );
      } catch (err) {
        this.logger.error(
          `❌ Erreur envoi email d'activation user ${saved.emetteurId}:`,
          err,
        );
      }
    }

    return saved;
  }

  /* ============================================
     REFUSER (admin)
     ============================================ */
  async refuser(id: number, dto: RefuserDemandeDto, adminId: number) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.statut !== StatutDemandeEnum.EN_ATTENTE) {
      throw new BadRequestException("Cette demande n'est plus en attente");
    }

    demande.statut = StatutDemandeEnum.REFUSEE;
    demande.motifRefus = dto.motifRefus;
    demande.traiteParId = adminId;
    demande.dateTraitement = new Date();

    const saved = await this.demandeRepository.save(demande);

    if (saved.emetteurId) {
      await this.safeNotify({
        utilisateurId: saved.emetteurId,
        titre: "Demande refusée",
        message: `Votre demande "${
          (saved as any).titre || ""
        }" a été refusée. Motif : ${dto.motifRefus || "non précisé"}.`,
        type: TypeNotificationEnum.ALERTE,
        lien: "/pme/dashboard",
        icone: "alert",
      });
    }

    return saved;
  }

  /* ============================================
     DEMANDER RDV (admin)
     ============================================ */
  async demanderRdv(id: number, dto: DemanderRdvDto, adminId: number) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    demande.statut = StatutDemandeEnum.RDV_DEMANDE;
    if (dto.dateSouhaitee) {
      demande.dateSouhaitee = new Date(dto.dateSouhaitee);
    }
    demande.traiteParId = adminId;
    demande.dateTraitement = new Date();

    const saved = await this.demandeRepository.save(demande);

    if (saved.emetteurId) {
      const dateTxt = dto.dateSouhaitee
        ? new Date(dto.dateSouhaitee).toLocaleString("fr-FR")
        : "à définir";
      await this.safeNotify({
        utilisateurId: saved.emetteurId,
        titre: "Rendez-vous demandé",
        message: `La CCI vous propose un rendez-vous : ${dateTxt}.`,
        type: TypeNotificationEnum.RDV,
        lien: "/pme/dashboard",
        icone: "calendar",
      });
    }

    return saved;
  }

  /* ============================================
     ACCEPTER (par le mentor) + assignation auto du mentor
     ============================================ */
  async accepter(id: number, user: any) {
    const demande = await this.demandeRepository.findOne({
      where: { id },
      relations: ["entreprise", "emetteur"],
    });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.cibleId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Vous n'êtes pas le destinataire");
    }

    if (
      demande.statut !== StatutDemandeEnum.EN_ATTENTE &&
      demande.statut !== StatutDemandeEnum.VALIDEE
    ) {
      throw new BadRequestException("Cette demande ne peut pas être acceptée");
    }

    demande.statut = StatutDemandeEnum.ACCEPTEE;
    const saved = await this.demandeRepository.save(demande);

    // ✅ NOUVEAU : Si c'est un mentorat, on assigne automatiquement le mentor à l'entreprise
    if (
      saved.type === TypeDemandeEnum.MENTORAT &&
      saved.cibleId &&
      saved.entrepriseId
    ) {
      try {
        await this.demandeRepository.manager
          .createQueryBuilder()
          .update("entreprises")
          .set({ mentorId: saved.cibleId })
          .where("id = :id", { id: saved.entrepriseId })
          .execute();

        this.logger.log(
          `✅ Mentor ${saved.cibleId} assigné à l'entreprise ${saved.entrepriseId}`,
        );
      } catch (err) {
        this.logger.error(
          `❌ Erreur assignation mentor entreprise ${saved.entrepriseId}:`,
          err,
        );
      }
    }

    // 🔔 Notifier l'émetteur
    if (saved.emetteurId && saved.emetteurId !== user.id) {
      await this.safeNotify({
        utilisateurId: saved.emetteurId,
        titre: "Demande acceptée",
        message: `Votre demande "${(saved as any).titre || ""}" a été acceptée.`,
        type: TypeNotificationEnum.MENTORAT,
        lien: "/pme/mentorat",
        icone: "check",
      });
    }

    return saved;
  }

  async refuserParCible(id: number, dto: RefuserDemandeDto, user: any) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.cibleId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Vous n'êtes pas le destinataire");
    }

    demande.statut = StatutDemandeEnum.REFUSEE_PAR_CIBLE;
    demande.motifRefus = dto.motifRefus;
    const saved = await this.demandeRepository.save(demande);

    if (saved.emetteurId && saved.emetteurId !== user.id) {
      await this.safeNotify({
        utilisateurId: saved.emetteurId,
        titre: "Demande refusée",
        message: `Votre demande "${
          (saved as any).titre || ""
        }" a été refusée. Motif : ${dto.motifRefus || "non précisé"}.`,
        type: TypeNotificationEnum.ALERTE,
        lien: "/pme/mentorat",
        icone: "alert",
      });
    }

    return saved;
  }

  async terminer(id: number) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    demande.statut = StatutDemandeEnum.TERMINEE;
    demande.dateCloture = new Date();
    return this.demandeRepository.save(demande);
  }

  async annuler(id: number, user: any) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.emetteurId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Vous ne pouvez pas annuler cette demande");
    }

    if (
      demande.statut === StatutDemandeEnum.TERMINEE ||
      demande.statut === StatutDemandeEnum.ANNULEE
    ) {
      throw new BadRequestException("Cette demande est déjà clôturée");
    }

    demande.statut = StatutDemandeEnum.ANNULEE;
    return this.demandeRepository.save(demande);
  }

  async evaluer(id: number, dto: EvaluerDemandeDto, user: any) {
    const demande = await this.demandeRepository.findOne({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande ${id} introuvable`);

    if (demande.emetteurId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Vous ne pouvez pas évaluer cette demande");
    }

    if (demande.statut !== StatutDemandeEnum.TERMINEE) {
      throw new BadRequestException(
        "Seules les demandes terminées peuvent être évaluées",
      );
    }

    if (demande.note) {
      throw new BadRequestException("Cette demande a déjà été évaluée");
    }

    demande.note = dto.note;
    demande.commentaireEvaluation = dto.commentaireEvaluation || null;
    demande.dateEvaluation = new Date();

    return this.demandeRepository.save(demande);
  }

  async getStats() {
    const total = await this.demandeRepository.count();
    const enAttente = await this.demandeRepository.count({
      where: { statut: StatutDemandeEnum.EN_ATTENTE },
    });
    const validees = await this.demandeRepository.count({
      where: { statut: StatutDemandeEnum.VALIDEE },
    });
    const acceptees = await this.demandeRepository.count({
      where: { statut: StatutDemandeEnum.ACCEPTEE },
    });
    const refusees = await this.demandeRepository.count({
      where: { statut: StatutDemandeEnum.REFUSEE },
    });
    const mentorats = await this.demandeRepository.count({
      where: { type: TypeDemandeEnum.MENTORAT },
    });
    const collaborations = await this.demandeRepository.count({
      where: { type: TypeDemandeEnum.COLLABORATION },
    });
    const rdvs = await this.demandeRepository.count({
      where: { type: TypeDemandeEnum.RDV },
    });

    return {
      total,
      enAttente,
      validees,
      acceptees,
      refusees,
      mentorats,
      collaborations,
      rdvs,
    };
  }
}