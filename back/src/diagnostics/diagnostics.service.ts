import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import {
  Diagnostic,
  NiveauDiagnosticEnum,
  StatutDiagnosticEnum,
  TypeDiagnosticEnum,
} from "./entities/diagnostic.entity";
import {
  QuestionDiagnostic,
  TypeQuestionEnum,
} from "./entities/question-diagnostic.entity";
import { Entreprise } from "../entreprises/entities/entreprise.entity";
import { CreateDiagnosticDto } from "./dto/create-diagnostic.dto";
import { SubmitDiagnosticDto } from "./dto/submit-diagnostic.dto";
import { QueryDiagnosticDto } from "./dto/query-diagnostic.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@Injectable()
export class DiagnosticsService {
  constructor(
    @InjectRepository(Diagnostic)
    private readonly diagnosticRepository: Repository<Diagnostic>,
    @InjectRepository(QuestionDiagnostic)
    private readonly questionRepository: Repository<QuestionDiagnostic>,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
  ) {}

  /* ============================================
     QUESTIONS
     ============================================ */

  async findAllQuestions(actif = true) {
    return this.questionRepository.find({
      where: { actif },
      order: { categorie: "ASC", ordre: "ASC" },
    });
  }

  async findOneQuestion(id: number) {
    const q = await this.questionRepository.findOne({ where: { id } });
    if (!q) throw new NotFoundException(`Question ${id} introuvable`);
    return q;
  }

  async createQuestion(dto: CreateQuestionDto) {
    const question = this.questionRepository.create(dto as any);
    return this.questionRepository.save(question);
  }

  async updateQuestion(id: number, dto: UpdateQuestionDto) {
    const question = await this.findOneQuestion(id);
    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  async deleteQuestion(id: number) {
    const question = await this.findOneQuestion(id);
    question.actif = false;
    return this.questionRepository.save(question);
  }

  /* ============================================
     DIAGNOSTICS
     ============================================ */

  async create(dto: CreateDiagnosticDto, user: any) {
    // Vérifier l'entreprise
    const entreprise = await this.entrepriseRepository.findOne({
      where: { id: dto.entrepriseId },
    });
    if (!entreprise) {
      throw new NotFoundException(`Entreprise ${dto.entrepriseId} introuvable`);
    }

    // Autorisation
    if (user.role !== "ADMIN" && entreprise.dirigeantId !== user.id) {
      throw new ForbiddenException(
        "Vous ne pouvez pas diagnostiquer cette entreprise",
      );
    }

    // Générer une référence unique et sécurisée
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const reference = `CCI-HM-DIAG-${year}-${timestamp}${random}`;

    const diagnostic = this.diagnosticRepository.create({
      entrepriseId: dto.entrepriseId,
      conseillerId: user.role === "ADMIN" ? user.id : null,
      reference,
      type: dto.autoEvaluation
        ? TypeDiagnosticEnum.AUTO_EVALUATION
        : TypeDiagnosticEnum.ACCOMPAGNE,
      statut: StatutDiagnosticEnum.EN_COURS,
      reponses: {},
      scoresParCategorie: {},
      recommandations: [],
      pointsForts: [],
      pointsAmeliorer: [],
    } as any);

    return this.diagnosticRepository.save(diagnostic);
  }

  async submit(id: number, dto: SubmitDiagnosticDto, user: any) {
    const diagnostic = await this.diagnosticRepository.findOne({
      where: { id },
    });
    if (!diagnostic) {
      throw new NotFoundException(`Diagnostic ${id} introuvable`);
    }

    if (diagnostic.statut !== StatutDiagnosticEnum.EN_COURS) {
      throw new BadRequestException(
        "Ce diagnostic a déjà été soumis ou validé",
      );
    }

    const questions = await this.questionRepository.find({
      where: { actif: true },
    });

    if (questions.length === 0) {
      throw new BadRequestException("Aucune question active");
    }

    const scoresParCategorie: Record<
      string,
      { total: number; count: number }
    > = {};
    let scoreGlobalSum = 0;
    let scoreGlobalMax = 0;

    for (const question of questions) {
      const reponse = dto.reponses[question.id];
      if (reponse === undefined) continue;

      const cat = question.categorie;
      if (!scoresParCategorie[cat]) {
        scoresParCategorie[cat] = { total: 0, count: 0 };
      }

      let noteQuestion = 0;

      if (question.typeReponse === TypeQuestionEnum.NOTE) {
        noteQuestion = ((Number(reponse) - 1) / 4) * 100;
      } else if (question.typeReponse === TypeQuestionEnum.OUI_NON) {
        noteQuestion = reponse === true || reponse === "oui" ? 100 : 0;
      } else if (question.typeReponse === TypeQuestionEnum.CHOIX) {
        const maxIdx = (question.options?.length || 1) - 1;
        const idx = Number(reponse);
        noteQuestion = maxIdx > 0 ? (idx / maxIdx) * 100 : 100;
      } else {
        noteQuestion = 50;
      }

      const poids = Number(question.poids) || 1;
      scoresParCategorie[cat].total += noteQuestion * poids;
      scoresParCategorie[cat].count += poids;

      scoreGlobalSum += noteQuestion * poids;
      scoreGlobalMax += 100 * poids;
    }

    const scoresParCategorieFinal: Record<string, number> = {};
    for (const [cat, data] of Object.entries(scoresParCategorie)) {
      scoresParCategorieFinal[cat] = Number(
        (data.total / (data.count || 1)).toFixed(2),
      );
    }

    const scoreGlobal =
      scoreGlobalMax > 0
        ? Number(((scoreGlobalSum / scoreGlobalMax) * 100).toFixed(2))
        : 0;

    let niveau: NiveauDiagnosticEnum;
    if (scoreGlobal < 50) niveau = NiveauDiagnosticEnum.DEBUTANT;
    else if (scoreGlobal < 70) niveau = NiveauDiagnosticEnum.INTERMEDIAIRE;
    else if (scoreGlobal < 85) niveau = NiveauDiagnosticEnum.AVANCE;
    else niveau = NiveauDiagnosticEnum.EXCELLENCE;

    const recommandations = this.genererRecommandations(
      scoresParCategorieFinal,
    );

    const sortedCats = Object.entries(scoresParCategorieFinal).sort(
      (a, b) => b[1] - a[1],
    );
    const pointsForts = sortedCats
      .filter(([, score]) => score >= 70)
      .map(([cat, score]) => `${cat} : ${score}/100`);
    const pointsAmeliorer = sortedCats
      .filter(([, score]) => score < 70)
      .map(([cat, score]) => `${cat} : ${score}/100`);

    diagnostic.reponses = dto.reponses;
    diagnostic.scoresParCategorie = scoresParCategorieFinal;
    diagnostic.scoreGlobal = scoreGlobal;
    diagnostic.niveau = niveau;
    diagnostic.recommandations = recommandations;
    diagnostic.pointsForts = pointsForts;
    diagnostic.pointsAmeliorer = pointsAmeliorer;
    diagnostic.commentaire = dto.commentaire || null;
    diagnostic.statut = StatutDiagnosticEnum.TERMINE;

    return this.diagnosticRepository.save(diagnostic);
  }

  private genererRecommandations(scores: Record<string, number>): any[] {
    const recos: any[] = [];
    const seuil = 70;

    if (scores["Finance"] !== undefined && scores["Finance"] < seuil) {
      recos.push({
        axe: "Finance",
        priorite: 1,
        impact: "Élevé",
        titre: "Structurer la comptabilité et la trésorerie",
        description:
          "Transition vers un logiciel de comptabilité certifié DGI et mise en place d'un plan de trésorerie prévisionnel.",
      });
    }

    if (scores["Marketing"] !== undefined && scores["Marketing"] < seuil) {
      recos.push({
        axe: "Marketing",
        priorite: 2,
        impact: "Moyen",
        titre: "Développer la présence commerciale",
        description:
          "Définition d'une stratégie marketing, présence digitale et prospection active.",
      });
    }

    if (scores["Gestion"] !== undefined && scores["Gestion"] < seuil) {
      recos.push({
        axe: "Gestion",
        priorite: 2,
        impact: "Élevé",
        titre: "Formaliser la gouvernance et le pilotage",
        description:
          "Élaboration d'un plan d'affaires formalisé et suivi d'indicateurs de performance.",
      });
    }

    if (scores["RH"] !== undefined && scores["RH"] < seuil) {
      recos.push({
        axe: "RH",
        priorite: 3,
        impact: "Moyen",
        titre: "Structurer la gestion des ressources humaines",
        description:
          "Formalisation des contrats, plan de formation et respect des obligations sociales.",
      });
    }

    if (scores["Numérique"] !== undefined && scores["Numérique"] < seuil) {
      recos.push({
        axe: "Numérique",
        priorite: 3,
        impact: "Moyen",
        titre: "Accélérer la transformation numérique",
        description:
          "Adoption d'outils collaboratifs, création d'un site web et sécurisation des données.",
      });
    }

    return recos;
  }

  async findMesDiagnostics(user: any, query: QueryDiagnosticDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const entreprises = await this.entrepriseRepository.find({
      where: { dirigeantId: user.id },
      select: ["id"],
    });
    const ids = entreprises.map((e) => e.id);

    if (ids.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const where: any = { entrepriseId: In(ids) };
    if (query.niveau) where.niveau = query.niveau;
    if (query.statut) where.statut = query.statut;

    const [items, total] = await this.diagnosticRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["entreprise", "conseiller"],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(query: QueryDiagnosticDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.niveau) where.niveau = query.niveau;
    if (query.statut) where.statut = query.statut;

    const [items, total] = await this.diagnosticRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      relations: ["entreprise", "conseiller"],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number, user: any) {
    const diagnostic = await this.diagnosticRepository.findOne({
      where: { id },
      relations: ["entreprise", "conseiller", "validePar"],
    });
    if (!diagnostic) {
      throw new NotFoundException(`Diagnostic ${id} introuvable`);
    }

    const entreprise = await this.entrepriseRepository.findOne({
      where: { id: diagnostic.entrepriseId },
    });

    const isAuthorized =
      user.role === "ADMIN" ||
      diagnostic.conseillerId === user.id ||
      entreprise?.dirigeantId === user.id;

    if (!isAuthorized) {
      throw new ForbiddenException("Accès refusé à ce diagnostic");
    }

    return diagnostic;
  }

  async valider(id: number, adminId: number) {
    const diagnostic = await this.diagnosticRepository.findOne({
      where: { id },
    });
    if (!diagnostic) {
      throw new NotFoundException(`Diagnostic ${id} introuvable`);
    }

    if (diagnostic.statut !== StatutDiagnosticEnum.TERMINE) {
      throw new BadRequestException(
        "Seuls les diagnostics terminés peuvent être validés",
      );
    }

    diagnostic.statut = StatutDiagnosticEnum.VALIDE;
    diagnostic.valideParId = adminId;
    diagnostic.dateValidation = new Date();
    return this.diagnosticRepository.save(diagnostic);
  }

  async comparer(id: number, user: any) {
    const current = await this.findOne(id, user);

    const previous = await this.diagnosticRepository
      .createQueryBuilder("d")
      .where("d.entrepriseId = :eid", { eid: current.entrepriseId })
      .andWhere("d.id != :id", { id: current.id })
      .orderBy("d.createdAt", "DESC")
      .getOne();

    if (!previous) {
      return {
        current: {
          id: current.id,
          scoreGlobal: current.scoreGlobal,
          niveau: current.niveau,
          scoresParCategorie: current.scoresParCategorie,
          date: current.createdAt,
        },
        previous: null,
        evolution: null,
        evolutionGlobale: null,
        message: "Aucun diagnostic précédent pour comparaison",
      };
    }

    const evolution: Record<string, number> = {};
    const currentScores = current.scoresParCategorie || {};
    const prevScores = previous.scoresParCategorie || {};

    for (const cat of Object.keys(currentScores)) {
      if (prevScores[cat] !== undefined) {
        evolution[cat] = Number(
          (currentScores[cat] - prevScores[cat]).toFixed(2),
        );
      }
    }

    const evolutionGlobale = Number(
      ((current.scoreGlobal || 0) - (previous.scoreGlobal || 0)).toFixed(2),
    );

    return {
      current: {
        id: current.id,
        scoreGlobal: current.scoreGlobal,
        niveau: current.niveau,
        scoresParCategorie: current.scoresParCategorie,
        date: current.createdAt,
      },
      previous: {
        id: previous.id,
        scoreGlobal: previous.scoreGlobal,
        niveau: previous.niveau,
        scoresParCategorie: previous.scoresParCategorie,
        date: previous.createdAt,
      },
      evolution,
      evolutionGlobale,
    };
  }

  async getStats() {
    const total = await this.diagnosticRepository.count();
    const termines = await this.diagnosticRepository.count({
      where: { statut: StatutDiagnosticEnum.TERMINE },
    });
    const valides = await this.diagnosticRepository.count({
      where: { statut: StatutDiagnosticEnum.VALIDE },
    });
    const enCours = await this.diagnosticRepository.count({
      where: { statut: StatutDiagnosticEnum.EN_COURS },
    });

    const scoreMoyen = await this.diagnosticRepository
      .createQueryBuilder("d")
      .select("AVG(d.scoreGlobal)", "avg")
      .where("d.scoreGlobal IS NOT NULL")
      .getRawOne();

    return {
      total,
      termines,
      valides,
      enCours,
      scoreMoyen: Number(Number(scoreMoyen?.avg || 0).toFixed(2)),
    };
  }

  async getRepartition() {
    const debutant = await this.diagnosticRepository.count({
      where: { niveau: NiveauDiagnosticEnum.DEBUTANT },
    });
    const intermediaire = await this.diagnosticRepository.count({
      where: { niveau: NiveauDiagnosticEnum.INTERMEDIAIRE },
    });
    const avance = await this.diagnosticRepository.count({
      where: { niveau: NiveauDiagnosticEnum.AVANCE },
    });
    const excellence = await this.diagnosticRepository.count({
      where: { niveau: NiveauDiagnosticEnum.EXCELLENCE },
    });
    const total = debutant + intermediaire + avance + excellence;

    return {
      debutant: {
        count: debutant,
        pourcentage: total > 0 ? Math.round((debutant / total) * 100) : 0,
      },
      intermediaire: {
        count: intermediaire,
        pourcentage: total > 0 ? Math.round((intermediaire / total) * 100) : 0,
      },
      avance: {
        count: avance,
        pourcentage: total > 0 ? Math.round((avance / total) * 100) : 0,
      },
      excellence: {
        count: excellence,
        pourcentage: total > 0 ? Math.round((excellence / total) * 100) : 0,
      },
      total,
    };
  }
}