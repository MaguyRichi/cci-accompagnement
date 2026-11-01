import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionFPD } from './entities/session-fpd.entity';
import { InscriptionFPD, StatutInscriptionFPDEnum } from './entities/inscription-fpd.entity';
import { ModuleFPD } from './entities/module-fpd.entity';
import { QuizFPD } from './entities/quiz-fpd.entity';
import { ResultatFPD } from './entities/resultat-fpd.entity';
import { StatutSessionEnum } from './entities/enums';

import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QueryInscriptionsFPDDto, QuerySessionsFPDDto } from './dto/query-fpd.dto';

import { User } from '../users/entities/user.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { TypeNotificationEnum } from '../notifications/entities/notification.entity';

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

const SEUIL_VALIDATION_MIN = 50;

@Injectable()
export class FpdService {
  private readonly logger = new Logger(FpdService.name);

  constructor(
    @InjectRepository(SessionFPD) private readonly sessionRepository: Repository<SessionFPD>,
    @InjectRepository(InscriptionFPD) private readonly inscriptionRepository: Repository<InscriptionFPD>,
    @InjectRepository(ModuleFPD) private readonly moduleRepository: Repository<ModuleFPD>,
    @InjectRepository(QuizFPD) private readonly quizRepository: Repository<QuizFPD>,
    @InjectRepository(ResultatFPD) private readonly resultatRepository: Repository<ResultatFPD>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Entreprise) private readonly entrepriseRepository: Repository<Entreprise>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async computeProgression(inscription: InscriptionFPD) {
    try {
      const totalQuizzes = await this.quizRepository
        .createQueryBuilder('quiz')
        .leftJoin('quiz.module', 'module')
        .where('module.sessionId = :sessionId', { sessionId: inscription.sessionId })
        .getCount();

      const completedQuizzes = await this.resultatRepository
        .createQueryBuilder('resultat')
        .leftJoin('resultat.quiz', 'quiz')
        .leftJoin('quiz.module', 'module')
        .where('resultat.inscriptionId = :inscriptionId', { inscriptionId: inscription.id })
        .andWhere('resultat.score = 1')
        .andWhere('module.sessionId = :sessionId', { sessionId: inscription.sessionId })
        .getCount();

      const progression = totalQuizzes === 0 ? 0 : Math.round((completedQuizzes / totalQuizzes) * 100);

      inscription.progression = progression;
      inscription.totalQuizzes = totalQuizzes;
      inscription.completedQuizzes = completedQuizzes;
    } catch (err) {
      this.logger.error(`[computeProgression] inscription ${inscription.id}:`, err);
      inscription.progression = inscription.progression ?? 0;
    }
    return inscription;
  }

  async findSessions(query: QuerySessionsFPDDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.metier) where.metier = query.metier;
    if (query.statut) where.statut = query.statut;

    const [items, total] = await this.sessionRepository.findAndCount({
      where,
      order: { dateDebut: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findSessionsPublic() {
    return this.sessionRepository.find({
      where: [
        { statut: StatutSessionEnum.PLANIFIEE, estPrivee: false },
        { statut: StatutSessionEnum.EN_COURS, estPrivee: false },
      ],
      order: { dateDebut: 'ASC' },
    });
  }

  async findMesSessionsDirigeant(userId: number) {
    let entreprise: Entreprise | null = null;
    try {
      entreprise = await this.entrepriseRepository.findOne({
        where: { dirigeantId: userId },
      });
    } catch (err) {
      this.logger.error(`[findMesSessionsDirigeant] entreprise lookup user ${userId}:`, err);
    }

    const mentorId = entreprise?.mentorId ?? null;

    this.logger.log(
      `[findMesSessionsDirigeant] userId=${userId} entrepriseId=${entreprise?.id ?? 'NONE'} mentorId=${mentorId ?? 'NONE'}`,
    );

    const statuts = [StatutSessionEnum.PLANIFIEE, StatutSessionEnum.EN_COURS];

    let toutes: SessionFPD[] = [];
    try {
      toutes = await this.sessionRepository
        .createQueryBuilder('session')
        .where('session.statut IN (:...statuts)', { statuts })
        .orderBy('session.dateDebut', 'ASC')
        .getMany();
    } catch (err) {
      this.logger.error(`[findMesSessionsDirigeant] query failed:`, err);
      return [];
    }

    const visibles = toutes.filter((s) => {
      if (!s.estPrivee) return true;
      if (mentorId == null) return false;
      return Number(s.createurId) === Number(mentorId);
    });

    this.logger.log(
      `[findMesSessionsDirigeant] total=${toutes.length} visibles=${visibles.length} (privées=${visibles.filter((s) => s.estPrivee).length})`,
    );

    return visibles;
  }

  async findSessionsMentor(mentorId: number) {
    const sessions = await this.sessionRepository.find({
      where: { createurId: mentorId },
      order: { dateDebut: 'DESC' },
    });
    this.logger.log(`[findSessionsMentor] mentorId=${mentorId} count=${sessions.length}`);
    return sessions;
  }

  async findOneSession(id: number) {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Session ${id} introuvable`);
    return session;
  }

  async createSession(dto: CreateSessionDto, user: any) {
    const role = String(user?.role ?? '').trim().toUpperCase();

    const data: any = {
      ...dto,
      placesTotales: dto.placesTotales || 20,
      placesRestantes: dto.placesTotales || 20,
      estPrivee: dto.estPrivee === true,
      statut: (dto as any).statut || StatutSessionEnum.PLANIFIEE,
    };

    if (role === 'MENTOR') {
      data.createurId = user.id;
    }

    this.logger.log(
      `[createSession] role=${role} userId=${user?.id} estPrivee=${data.estPrivee} createurId=${data.createurId} statut=${data.statut}`,
    );

    const session = this.sessionRepository.create(data);
    const raw = await this.sessionRepository.save(session);
    return Array.isArray(raw) ? raw[0] : raw;
  }

  async updateSession(id: number, dto: UpdateSessionDto) {
    const session = await this.findOneSession(id);
    Object.assign(session, dto);
    return this.sessionRepository.save(session);
  }

  async deleteSession(id: number) {
    const session = await this.findOneSession(id);
    await this.sessionRepository.remove(session);
    return { message: 'Session supprimée' };
  }

  async createModule(
    sessionId: number,
    mentorId: number,
    data: { titre: string; description?: string; ordre?: number },
  ) {
    await this.findOneSession(sessionId);

    const isAssigned = await this.inscriptionRepository
      .createQueryBuilder('i')
      .leftJoin('i.entreprise', 'entreprise')
      .where('i.sessionId = :sessionId', { sessionId })
      .andWhere('entreprise.mentorId = :mentorId', { mentorId })
      .getCount();

    if (isAssigned === 0) {
      const session = await this.findOneSession(sessionId);
      if (Number(session.createurId) !== Number(mentorId)) {
        throw new ForbiddenException("Vous n'êtes pas le mentor assigné à cette session.");
      }
    }

    const module = this.moduleRepository.create({ ...data, sessionId });
    const saved = await this.moduleRepository.save(module);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getModulesWithQuizzes(sessionId: number) {
    if (!sessionId || !Number.isFinite(Number(sessionId))) {
      return [];
    }

    let modules: ModuleFPD[] = [];
    try {
      modules = await this.moduleRepository.find({
        where: { sessionId: Number(sessionId) },
        order: { ordre: 'ASC' },
      });
    } catch (err) {
      this.logger.warn(`[getModulesWithQuizzes] order by ordre failed, fallback: ${errMessage(err)}`);
      try {
        modules = await this.moduleRepository.find({ where: { sessionId: Number(sessionId) } });
      } catch (err2) {
        this.logger.error(`[getModulesWithQuizzes] find failed session ${sessionId}:`, err2);
        return [];
      }
    }

    if (!modules || modules.length === 0) return [];

    const moduleIds = modules.map((m) => m.id);

    let quizzes: QuizFPD[] = [];
    try {
      quizzes = await this.quizRepository
        .createQueryBuilder('quiz')
        .leftJoinAndSelect('quiz.module', 'module')
        .where('quiz.moduleId IN (:...moduleIds)', { moduleIds })
        .orderBy('quiz.ordre', 'ASC')
        .getMany();
    } catch (err) {
      this.logger.warn(`[getModulesWithQuizzes] quiz query failed, fallback: ${errMessage(err)}`);
      try {
        quizzes = await this.quizRepository
          .createQueryBuilder('quiz')
          .where('quiz.moduleId IN (:...moduleIds)', { moduleIds })
          .getMany();
      } catch (err2) {
        this.logger.error(`[getModulesWithQuizzes] quiz find failed:`, err2);
        quizzes = [];
      }
    }

    return modules.map((mod) => ({
      ...mod,
      quizzes: (quizzes || []).filter((q: any) => {
        const qModuleId = q.module?.id ?? q.moduleId;
        return Number(qModuleId) === Number(mod.id);
      }),
    }));
  }

  async createQuiz(
    moduleId: number,
    mentorId: number,
    data: { question: string; options: string[]; bonneReponse: number; ordre?: number },
  ) {
    const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Module introuvable');

    const session = await this.findOneSession(module.sessionId);

    const isAssigned = await this.inscriptionRepository
      .createQueryBuilder('i')
      .leftJoin('i.entreprise', 'entreprise')
      .where('i.sessionId = :sessionId', { sessionId: module.sessionId })
      .andWhere('entreprise.mentorId = :mentorId', { mentorId })
      .getCount();

    if (isAssigned === 0 && Number(session.createurId) !== Number(mentorId)) {
      throw new ForbiddenException('Accès refusé.');
    }

    const quiz = this.quizRepository.create({ ...data, moduleId });
    const saved = await this.quizRepository.save(quiz);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateQuiz(
    quizId: number,
    mentorId: number,
    data: { question?: string; options?: string[]; bonneReponse?: number; ordre?: number },
  ) {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz introuvable');

    const module = await this.moduleRepository.findOne({ where: { id: quiz.moduleId } });
    if (!module) throw new NotFoundException('Module introuvable');

    const session = await this.findOneSession(module.sessionId);

    const isAssigned = await this.inscriptionRepository
      .createQueryBuilder('i')
      .leftJoin('i.entreprise', 'entreprise')
      .where('i.sessionId = :sessionId', { sessionId: session.id })
      .andWhere('entreprise.mentorId = :mentorId', { mentorId })
      .getCount();

    if (isAssigned === 0 && Number(session.createurId) !== Number(mentorId)) {
      throw new ForbiddenException('Accès refusé.');
    }

    await this.resultatRepository
      .createQueryBuilder()
      .delete()
      .from(ResultatFPD)
      .where('quizId = :quizId', { quizId })
      .execute();

    Object.assign(quiz, data);
    const saved = await this.quizRepository.save(quiz);
    const result = Array.isArray(saved) ? saved[0] : saved;

    const inscriptionsImpactees = await this.inscriptionRepository.find({
      where: { sessionId: session.id },
    });
    for (const insc of inscriptionsImpactees) {
      await this.computeProgression(insc);
      if (insc.statut === StatutInscriptionFPDEnum.TERMINEE && insc.progression! < 100) {
        insc.statut = StatutInscriptionFPDEnum.EN_COURS;
      }
      await this.inscriptionRepository.save(insc);
    }

    return result;
  }

  async deleteQuiz(quizId: number, mentorId: number) {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz introuvable');

    const module = await this.moduleRepository.findOne({ where: { id: quiz.moduleId } });
    if (!module) throw new NotFoundException('Module introuvable');

    const session = await this.findOneSession(module.sessionId);

    const isAssigned = await this.inscriptionRepository
      .createQueryBuilder('i')
      .leftJoin('i.entreprise', 'entreprise')
      .where('i.sessionId = :sessionId', { sessionId: session.id })
      .andWhere('entreprise.mentorId = :mentorId', { mentorId })
      .getCount();

    if (isAssigned === 0 && Number(session.createurId) !== Number(mentorId)) {
      throw new ForbiddenException('Accès refusé.');
    }

    await this.resultatRepository
      .createQueryBuilder()
      .delete()
      .from(ResultatFPD)
      .where('quizId = :quizId', { quizId })
      .execute();

    await this.quizRepository.remove(quiz);

    const inscriptionsImpactees = await this.inscriptionRepository.find({
      where: { sessionId: session.id },
    });
    for (const insc of inscriptionsImpactees) {
      await this.computeProgression(insc);
      if (insc.statut === StatutInscriptionFPDEnum.TERMINEE && insc.progression! < 100) {
        insc.statut = StatutInscriptionFPDEnum.EN_COURS;
      }
      await this.inscriptionRepository.save(insc);
    }

    return { message: 'Quiz supprimé' };
  }

  async inscrireDirigeant(sessionId: number, user: any) {
    if (user.role !== 'DIRIGEANT') {
      throw new ForbiddenException("Seuls les dirigeants de PME peuvent s'inscrire à une formation FPD.");
    }

    const entreprise = await this.entrepriseRepository.findOne({ where: { dirigeantId: user.id } });

    if (!entreprise) {
      throw new BadRequestException('Vous devez avoir une entreprise enregistrée pour suivre une formation FPD.');
    }

    if (!entreprise.mentorId) {
      throw new BadRequestException("Vous devez avoir un mentor assigné par la CCI pour suivre une formation FPD.");
    }

    const session = await this.findOneSession(sessionId);

    if (session.estPrivee && Number(session.createurId) !== Number(entreprise.mentorId)) {
      throw new ForbiddenException('Cette formation est privée et réservée aux mentorés de son créateur.');
    }

    if (session.placesRestantes <= 0) throw new BadRequestException('Plus de places disponibles dans cette session.');
    if (session.statut === StatutSessionEnum.TERMINEE || session.statut === StatutSessionEnum.ANNULEE) {
      throw new BadRequestException('Cette session est terminée ou annulée.');
    }

    const existing = await this.inscriptionRepository.findOne({
      where: { utilisateurId: user.id, sessionId },
    });
    if (existing) throw new BadRequestException('Vous êtes déjà inscrit à cette session.');

    const inscription = this.inscriptionRepository.create({
      utilisateurId: user.id,
      entrepriseId: entreprise.id,
      sessionId,
      statut: StatutInscriptionFPDEnum.EN_COURS,
      dateDebut: session.dateDebut,
      dateFin: session.dateFin,
    } as any);

    const raw = await this.inscriptionRepository.save(inscription);
    const saved: InscriptionFPD = Array.isArray(raw) ? raw[0] : raw;

    session.placesRestantes -= 1;
    await this.sessionRepository.save(session);

    if (entreprise.mentorId) {
      try {
        await this.notificationsService.create({
          utilisateurId: entreprise.mentorId,
          titre: "🎓 Votre mentoré s'est inscrit à une formation FPD",
          message: `${user.prenom} ${user.nom} s'est inscrit à la formation "${session.nom}". Vous devrez valider sa formation à la fin.`,
          type: TypeNotificationEnum.INFO,
          lien: '/pme/fpd/mentorats',
        } as any);
      } catch (err) {
        this.logger.error('Erreur notification mentor:', err);
      }
    }

    return this.findOneInscription(saved.id);
  }

  // ✅ CORRIGÉ ICI : Ajout de 'utilisateur' et 'entreprise' dans les relations
  async findOneInscription(id: number) {
    const inscription = await this.inscriptionRepository.findOne({
      where: { id },
      relations: ['session', 'utilisateur', 'entreprise', 'mentorValidateur'],
    });
    if (!inscription) throw new NotFoundException(`Inscription ${id} introuvable`);
    return this.computeProgression(inscription);
  }

  // ✅ CORRIGÉ ICI : Ajout de 'utilisateur' et 'entreprise' dans les relations
  async findMesInscriptions(userId: number) {
    const inscriptions = await this.inscriptionRepository.find({
      where: { utilisateurId: userId },
      relations: ['session', 'utilisateur', 'entreprise', 'mentorValidateur'],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(inscriptions.map((i) => this.computeProgression(i)));
  }

  async findInscriptionsPourMentor(mentorId: number) {
    const inscriptions = await this.inscriptionRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.session', 'session')
      .leftJoinAndSelect('i.utilisateur', 'utilisateur')
      .leftJoinAndSelect('i.entreprise', 'entreprise')
      .where('entreprise.mentorId = :mentorId', { mentorId })
      .orderBy('i.createdAt', 'DESC')
      .getMany();

    return Promise.all(inscriptions.map((i) => this.computeProgression(i)));
  }

  async submitQuizAnswer(inscriptionId: number, quizId: number, reponseIndex: number) {
    const inscription = await this.findOneInscription(inscriptionId);

    if (inscription.statut === StatutInscriptionFPDEnum.VALIDEE_PAR_MENTOR) {
      throw new BadRequestException('Formation déjà validée par le mentor.');
    }

    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz introuvable');

    const existing = await this.resultatRepository.findOne({ where: { inscriptionId, quizId } });
    if (existing) throw new BadRequestException('Ce quiz a déjà été validé.');

    const isCorrect = reponseIndex === quiz.bonneReponse;

    await this.resultatRepository.save(
      this.resultatRepository.create({ inscriptionId, quizId, score: isCorrect ? 1 : 0 }),
    );

    const updated = await this.computeProgression(inscription);

    if (updated.progression === 100) {
      updated.statut = StatutInscriptionFPDEnum.TERMINEE;
    } else if (updated.progression! < 100 && updated.statut === StatutInscriptionFPDEnum.TERMINEE) {
      updated.statut = StatutInscriptionFPDEnum.EN_COURS;
    }
    await this.inscriptionRepository.save(updated);

    return {
      correct: isCorrect,
      progression: updated.progression,
      completed: updated.progression === 100,
    };
  }

  async validerParMentor(
    inscriptionId: number,
    note: number,
    commentaire: string | undefined,
    mentorId: number,
  ) {
    const inscription = await this.findOneInscription(inscriptionId);

    if (inscription.entreprise?.mentorId !== mentorId) {
      throw new ForbiddenException("Vous n'êtes pas le mentor assigné à cette entreprise.");
    }

    if (inscription.statut === StatutInscriptionFPDEnum.VALIDEE_PAR_MENTOR) {
      throw new BadRequestException('Cette formation est déjà validée.');
    }

    if ((inscription.progression ?? 0) < SEUIL_VALIDATION_MIN) {
      throw new BadRequestException(
        `Le dirigeant doit avoir au moins ${SEUIL_VALIDATION_MIN}% de progression pour être validé. Progression actuelle : ${inscription.progression ?? 0}%.`,
      );
    }

    inscription.statut = StatutInscriptionFPDEnum.VALIDEE_PAR_MENTOR;
    inscription.mentorValidateurId = mentorId;
    inscription.dateValidationMentor = new Date();
    inscription.noteMentor = note;
    inscription.commentaireMentor = commentaire || null;
    inscription.dateBadge = new Date();

    const metierLabel = this.getMetierLabel(inscription.session.metier);
    inscription.badgeObtenu = `FPD ${metierLabel}`;

    if (!inscription.certificatNumero) {
      const year = new Date().getFullYear();
      const seq = String(inscription.id).padStart(4, '0');
      inscription.certificatNumero = `CCI-HM-FPD-${year}-${seq}`;
      inscription.certificatGenereAt = new Date();
    }

    const saved = await this.inscriptionRepository.save(inscription);

    try {
      const user = await this.userRepository.findOne({ where: { id: inscription.utilisateurId } });

      if (user) {
        const badges: any[] = user.badges || [];
        const newBadge = {
          id: `fpd-${String(inscription.session.metier).toLowerCase()}-${yearCode(inscription.dateBadge)}`,
          titre: inscription.badgeObtenu,
          session: inscription.session.nom,
          date: inscription.dateBadge,
          mentor: `${inscription.mentorValidateur?.prenom || ''} ${inscription.mentorValidateur?.nom || ''}`.trim(),
          note: Number(note),
          certificatNumero: inscription.certificatNumero,
          progression: inscription.progression ?? 0,
        };

        if (!badges.some((b) => b.id === newBadge.id)) {
          user.badges = [...badges, newBadge];
          await this.userRepository.save(user);
        }
      }

      await this.notificationsService.create({
        utilisateurId: inscription.utilisateurId,
        titre: '🎓 Félicitations ! Formation FPD validée',
        message: `Votre mentor a validé votre formation "${inscription.session.nom}" (progression : ${inscription.progression}%). Votre badge est disponible sur votre profil.`,
        type: TypeNotificationEnum.VALIDATION,
        lien: '/pme/fpd',
      } as any);
    } catch (err) {
      this.logger.error('Erreur mise à jour badge/notification:', err);
    }

    return this.findOneInscription(saved.id);
  }

  async findAllInscriptions(query: QueryInscriptionsFPDDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.statut) where.statut = query.statut;
    if (query.sessionId) where.sessionId = query.sessionId;

    const [items, total] = await this.inscriptionRepository.findAndCount({
      where,
      relations: ['session', 'utilisateur', 'entreprise', 'mentorValidateur'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: await Promise.all(items.map((i) => this.computeProgression(i))),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [totalSessions, totalInscriptions, totalValidees, totalEnCours] = await Promise.all([
      this.sessionRepository.count(),
      this.inscriptionRepository.count(),
      this.inscriptionRepository.count({ where: { statut: StatutInscriptionFPDEnum.VALIDEE_PAR_MENTOR } }),
      this.inscriptionRepository.count({ where: { statut: StatutInscriptionFPDEnum.EN_COURS } }),
    ]);

    return { totalSessions, totalInscriptions, totalValidees, totalEnCours };
  }

  private getMetierLabel(metier: string): string {
    const labels: Record<string, string> = {
      HOTELLERIE_TOURISME: 'Hôtellerie & Tourisme',
      SECRETARIAT: 'Secrétariat',
      GESTION_COMPTABILITE: 'Gestion & Comptabilité',
      ASSISTANT_BANCAIRE: 'Assistant Bancaire',
    };
    return labels[metier] || metier;
  }
}

function yearCode(date: Date | null): number {
  return date ? new Date(date).getFullYear() : new Date().getFullYear();
}