import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import {
  Avis,
  Entreprise,
  StatutEntrepriseEnum,
} from './entities/entreprise.entity';
import { User } from '../users/entities/user.entity';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';
import { QueryEntrepriseDto } from './dto/query-entreprise.dto';
import { QueryAnnuaireDto } from './dto/query-annuaire.dto';
import { CreateAvisDto } from './dto/create-avis.dto';
import { CreateProduitDto } from './dto/create-produit.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { TypeNotificationEnum } from '../notifications/entities/notification.entity';
import { StatutCotaEnum } from './entities/entreprise.entity';

@Injectable()
export class EntreprisesService {
  constructor(
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /* ============================================
     LISTE PUBLIQUE (avec filtres + pagination)
     ============================================ */
  async findAll(query: QueryEntrepriseDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    where.statut = query.statut
      ? (query.statut as StatutEntrepriseEnum)
      : StatutEntrepriseEnum.ACTIF;

    if (query.secteur) where.secteur = query.secteur;
    if (query.ville) where.ville = ILike(`%${query.ville}%`);
    if (query.region) where.region = query.region;
    if (query.taille) where.taille = query.taille;
    if (query.verifie === 'true') where.verifie = true;
    if (query.verifie === 'false') where.verifie = false;

    let whereConditions: any[] = [where];
    if (query.q) {
      whereConditions = [
        { ...where, raisonSociale: ILike(`%${query.q}%`) },
        { ...where, sigle: ILike(`%${query.q}%`) },
        { ...where, nif: ILike(`%${query.q}%`) },
        { ...where, produitPhare: ILike(`%${query.q}%`) },
      ];
    }

    let order: any = { createdAt: 'DESC' };
    if (query.sort === 'note') order = { noteMoyenne: 'DESC' };
    if (query.sort === 'vues') order = { nbVues: 'DESC' };
    if (query.sort === 'nom') order = { raisonSociale: 'ASC' };

    const [items, total] = await this.entrepriseRepository.findAndCount({
      where: whereConditions,
      order,
      skip,
      take: limit,
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
     ANNUAIRE DES RESSORTISSANTS (public)
     ============================================ */
  async findAnnuaire(query: QueryAnnuaireDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const qb = this.entrepriseRepository.createQueryBuilder('e');

    // Uniquement les entreprises actives
    qb.andWhere('e.statut = :statut', {
      statut: StatutEntrepriseEnum.ACTIF,
    });

    // Filtres
    if (query.secteur) {
      qb.andWhere('e.secteur = :secteur', { secteur: query.secteur });
    }
    if (query.ville) {
      qb.andWhere('e.ville ILIKE :ville', { ville: `%${query.ville}%` });
    }
    if (query.region) {
      qb.andWhere('e.region = :region', { region: query.region });
    }
    if (query.taille) {
      qb.andWhere('e.taille = :taille', { taille: query.taille });
    }
    if (query.effectifMin !== undefined) {
      qb.andWhere('e.effectif >= :effMin', { effMin: query.effectifMin });
    }
    if (query.effectifMax !== undefined) {
      qb.andWhere('e.effectif <= :effMax', { effMax: query.effectifMax });
    }
    if (query.verifie === 'true') {
      qb.andWhere('e.verifie = true');
    }
    if (query.verifie === 'false') {
      qb.andWhere('e.verifie = false');
    }

    // Recherche texte
    if (query.q) {
      qb.andWhere(
        `(e.raisonSociale ILIKE :q
          OR e.sigle ILIKE :q
          OR e.nif ILIKE :q
          OR e.produitPhare ILIKE :q
          OR e.description ILIKE :q
          OR e.motsCles::text ILIKE :q)`,
        { q: `%${query.q}%` },
      );
    }

    // ⚠️ Tri avec les NOMS DE PROPRIÉTÉS (camelCase)
    switch (query.sort) {
      case 'nom':
        qb.orderBy('e.raisonSociale', 'ASC');
        break;
      case 'note':
        qb.orderBy('e.noteMoyenne', 'DESC');
        break;
      case 'vues':
        qb.orderBy('e.nbVues', 'DESC');
        break;
      case 'effectif':
        qb.orderBy('e.effectif', 'DESC', 'NULLS LAST');
        break;
      default:
        qb.orderBy('e.createdAt', 'DESC');
    }

    qb.leftJoinAndSelect('e.dirigeant', 'dirigeant')
      .leftJoinAndSelect('e.mentor', 'mentor')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

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
     STATISTIQUES DE L'ANNUAIRE (public)
     ============================================ */
  async getAnnuaireStats() {
    const total = await this.entrepriseRepository.count({
      where: { statut: StatutEntrepriseEnum.ACTIF },
    });

    // Répartition par secteur
    const parSecteur = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('e.secteur', 'secteur')
      .addSelect('COUNT(*)', 'count')
      .where('e.statut = :statut', { statut: StatutEntrepriseEnum.ACTIF })
      .andWhere('e.secteur IS NOT NULL')
      .andWhere("e.secteur != ''")
      .groupBy('e.secteur')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Répartition par ville (top 10)
    const parVille = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('e.ville', 'ville')
      .addSelect('COUNT(*)', 'count')
      .where('e.statut = :statut', { statut: StatutEntrepriseEnum.ACTIF })
      .andWhere('e.ville IS NOT NULL')
      .andWhere("e.ville != ''")
      .groupBy('e.ville')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Répartition par taille
    const parTaille = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('e.taille', 'taille')
      .addSelect('COUNT(*)', 'count')
      .where('e.statut = :statut', { statut: StatutEntrepriseEnum.ACTIF })
      .andWhere('e.taille IS NOT NULL')
      .groupBy('e.taille')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Total vérifiées
    const verifiees = await this.entrepriseRepository.count({
      where: {
        statut: StatutEntrepriseEnum.ACTIF,
        verifie: true,
      },
    });

    return {
      total,
      verifiees,
      parSecteur: parSecteur.map((r) => ({
        secteur: r.secteur,
        count: Number(r.count),
      })),
      parVille: parVille.map((r) => ({
        ville: r.ville,
        count: Number(r.count),
      })),
      parTaille: parTaille.map((r) => ({
        taille: r.taille,
        count: Number(r.count),
      })),
    };
  }

  /* ============================================
     DÉTAIL PUBLIC
     ============================================ */
  async findOne(id: number, incrementViews = false) {
    const entreprise = await this.entrepriseRepository.findOne({
      where: { id },
      relations: ['dirigeant', 'mentor'],
    });

    if (!entreprise) {
      throw new NotFoundException(`Entreprise ${id} introuvable`);
    }

    if (incrementViews) {
      await this.entrepriseRepository.increment({ id }, 'nbVues', 1);
      entreprise.nbVues += 1;
    }

    return entreprise;
  }

  /* ============================================
     CRÉATION
     ============================================ */
  async create(dto: CreateEntrepriseDto, userId: number) {
    if (dto.nif) {
      const existing = await this.entrepriseRepository.findOne({
        where: { nif: dto.nif },
      });
      if (existing) {
        throw new BadRequestException('Ce NIF est déjà enregistré');
      }
    }

    const entreprise = this.entrepriseRepository.create({
      ...dto,
      taille: (dto.taille as any) || null,
      statut: StatutEntrepriseEnum.INACTIF,
      dirigeantId: userId,
      verifie: false,
    } as any);

    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     MISE À JOUR
     ============================================ */
  async update(id: number, dto: UpdateEntrepriseDto, user: any) {
    const entreprise = await this.findOne(id);

    if (user.role !== 'ADMIN' && entreprise.dirigeantId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier cette entreprise',
      );
    }

    const adminOnlyFields: (keyof UpdateEntrepriseDto)[] = [
      'verifie',
      'statut',
      'motifSuspension',
    ];
    for (const field of adminOnlyFields) {
      if (dto[field] !== undefined && user.role !== 'ADMIN') {
        throw new ForbiddenException(
          `Seul un administrateur peut modifier "${String(field)}"`,
        );
      }
    }

    Object.assign(entreprise, dto);
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     VÉRIFICATION (admin)
     ============================================ */
  async verifier(id: number) {
    const entreprise = await this.findOne(id);
    entreprise.verifie = true;
    entreprise.dateVerification = new Date();
    entreprise.statut = StatutEntrepriseEnum.ACTIF;
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     SUSPENSION (admin)
     ============================================ */
  async suspendre(id: number, motif: string) {
    const entreprise = await this.findOne(id);
    entreprise.statut = StatutEntrepriseEnum.SUSPENDU;
    entreprise.motifSuspension = motif;
    entreprise.dateSuspension = new Date();
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     RÉACTIVATION (admin)
     ============================================ */
  async reactiver(id: number) {
    const entreprise = await this.findOne(id);
    entreprise.statut = StatutEntrepriseEnum.ACTIF;
    entreprise.motifSuspension = null;
    entreprise.dateSuspension = null;
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     ASSIGNER UN MENTOR (admin)
     ============================================ */
  async assignerMentor(entrepriseId: number, mentorId: number) {
    const entreprise = await this.findOne(entrepriseId);
    const mentor = await this.userRepository.findOne({
      where: { id: mentorId, role: 'MENTOR' as any },
    });

    if (!mentor) {
      throw new NotFoundException(`Mentor ${mentorId} introuvable`);
    }

    entreprise.mentorId = mentorId;
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     RETIRER LE MENTOR (admin)
     ============================================ */
  async retirerMentor(entrepriseId: number) {
    const entreprise = await this.findOne(entrepriseId);
    entreprise.mentorId = null;
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     AJOUTER UN AVIS
     ============================================ */
  async ajouterAvis(id: number, dto: CreateAvisDto, user: any) {
    const entreprise = await this.findOne(id);

    const avisExist = entreprise.avis?.find((a) => a.user_id === user.id);
    if (avisExist) {
      throw new BadRequestException('Vous avez déjà laissé un avis');
    }

    const newAvis: Avis = {
      user_id: user.id,
      auteur_nom: dto.auteurNom || `${user.prenom} ${user.nom}`,
      auteur_photo: dto.auteurPhoto || undefined,
      note: dto.note,
      commentaire: dto.commentaire,
      date: new Date().toISOString(),
    };

    entreprise.avis = [...(entreprise.avis || []), newAvis];
    entreprise.nbAvis = entreprise.avis.length;

    const total = entreprise.avis.reduce((sum, a) => sum + a.note, 0);
    entreprise.noteMoyenne = Number(
      (total / entreprise.avis.length).toFixed(2),
    );

    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     SUPPRIMER UN AVIS (admin)
     ============================================ */
  async supprimerAvis(entrepriseId: number, userId: number) {
    const entreprise = await this.findOne(entrepriseId);
    entreprise.avis = (entreprise.avis || []).filter(
      (a) => a.user_id !== userId,
    );
    entreprise.nbAvis = entreprise.avis.length;

    if (entreprise.avis.length > 0) {
      const total = entreprise.avis.reduce((sum, a) => sum + a.note, 0);
      entreprise.noteMoyenne = Number(
        (total / entreprise.avis.length).toFixed(2),
      );
    } else {
      entreprise.noteMoyenne = 0;
    }

    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     AJOUTER UN PRODUIT
     ============================================ */
  async ajouterProduit(id: number, dto: CreateProduitDto, user: any) {
    const entreprise = await this.findOne(id);

    if (user.role !== 'ADMIN' && entreprise.dirigeantId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier les produits de cette entreprise',
      );
    }

    entreprise.listeProduits = [
      ...(entreprise.listeProduits || []),
      dto,
    ];
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     SUPPRIMER UN PRODUIT
     ============================================ */
  async supprimerProduit(id: number, index: number, user: any) {
    const entreprise = await this.findOne(id);

    if (user.role !== 'ADMIN' && entreprise.dirigeantId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier les produits de cette entreprise',
      );
    }

    if (index < 0 || index >= (entreprise.listeProduits || []).length) {
      throw new BadRequestException('Index de produit invalide');
    }

    entreprise.listeProduits = entreprise.listeProduits.filter(
      (_, i) => i !== index,
    );
    return this.entrepriseRepository.save(entreprise);
  }

  /* ============================================
     STATISTIQUES PUBLIQUES
     ============================================ */
  async getStatsPubliques() {
    const total = await this.entrepriseRepository.count({
      where: { statut: StatutEntrepriseEnum.ACTIF },
    });

    const avecMentor = await this.entrepriseRepository
      .createQueryBuilder('e')
      .where('e.statut = :statut', { statut: StatutEntrepriseEnum.ACTIF })
      .andWhere('e.mentorId IS NOT NULL')
      .getCount();

    const verifiees = await this.entrepriseRepository.count({
      where: { verifie: true, statut: StatutEntrepriseEnum.ACTIF },
    });

    const noteMoyenne = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('AVG(e.noteMoyenne)', 'avg')
      .where('e.noteMoyenne > 0')
      .getRawOne();

    return {
      totalPme: total,
      avecMentor,
      verifiees,
      noteMoyenneRegionale: Number(
        Number(noteMoyenne?.avg || 0).toFixed(2),
      ),
    };
  }

  /* ============================================
     TOP PME
     ============================================ */
  async getTopPme(limit = 6) {
    return this.entrepriseRepository.find({
      where: { statut: StatutEntrepriseEnum.ACTIF },
      order: { noteMoyenne: 'DESC', nbVues: 'DESC' },
      take: limit,
    });
  }

  /* ============================================
     MON ENTREPRISE (dirigeant connecté)
     ============================================ */
  async getMyEntreprise(userId: number) {
    const entreprise = await this.entrepriseRepository.findOne({
      where: { dirigeantId: userId },
      relations: ['dirigeant', 'mentor'],
    });

    if (!entreprise) {
      return null;
    }

    return entreprise;
  }

  /* ============================================
     CRON — Notifier les cotas en retard
     ============================================ */
  async notifierCotasEnRetard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entreprises = await this.entrepriseRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.dirigeant', 'dirigeant')
      .where('e.cota_echeance IS NOT NULL')
      .andWhere('e.cota_echeance < :today', { today })
      .andWhere('e.cota_statut IN (:...statuts)', {
        statuts: [StatutCotaEnum.IMPAYE, StatutCotaEnum.EN_RETARD],
      })
      .andWhere('e.dirigeant_id IS NOT NULL')
      .getMany();

    let count = 0;

    for (const ent of entreprises) {
      if (!ent.dirigeantId) continue;

      const recent = await this.notificationsService.findMesNotifications(
        ent.dirigeantId,
        { type: TypeNotificationEnum.COTA, limit: 1 } as any,
      );

      const lastNotif = recent?.data?.[0];
      if (lastNotif) {
        const daysSince =
          (Date.now() - new Date(lastNotif.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSince < 7) continue;
      }

      const echeanceTxt = ent.cotaEcheance
        ? new Date(ent.cotaEcheance).toLocaleDateString('fr-FR')
        : '—';

      try {
        await this.notificationsService.create({
          utilisateurId: ent.dirigeantId,
          titre: 'Cota en retard',
          message: `Le cota de "${ent.raisonSociale}" (échéance : ${echeanceTxt}) est en retard. Merci de régulariser votre situation.`,
          type: TypeNotificationEnum.COTA,
          lien: '/pme/dashboard',
          icone: 'alert',
        } as any);
        count++;
      } catch (err) {
        console.error(`Erreur notif cota entreprise ${ent.id}:`, err);
      }
    }

    return { notified: count, total: entreprises.length };
  }
}