import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import {
  Commentaire,
  Publication,
  TypePublicationEnum,
  VisibilitePublicationEnum,
} from './entities/publication.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { QueryPublicationDto } from './dto/query-publication.dto';
import { CreateCommentaireDto } from './dto/create-commentaire.dto';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
  ) {}

  /* ============================================
     MUR PUBLIC D'UNE PME
     ============================================ */
  async findMurEntreprise(
    entrepriseId: number,
    query: QueryPublicationDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const entreprise = await this.entrepriseRepository.findOne({
      where: { id: entrepriseId },
    });
    if (!entreprise) {
      throw new NotFoundException(`Entreprise ${entrepriseId} introuvable`);
    }

    const where: any = {
      entrepriseId,
      visibilite: VisibilitePublicationEnum.PUBLIC,
    };
    if (query.type) where.type = query.type;

    const [items, total] = await this.publicationRepository.findAndCount({
      where,
      order: { epingle: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['auteur'],
    });

    return {
      entreprise: {
        id: entreprise.id,
        raisonSociale: entreprise.raisonSociale,
        logo: entreprise.logo,
        verifie: entreprise.verifie,
        noteMoyenne: entreprise.noteMoyenne,
      },
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     FLUX PUBLIC GLOBAL (accueil)
     ============================================ */
  async findFluxPublic(query: QueryPublicationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      visibilite: VisibilitePublicationEnum.PUBLIC,
    };
    if (query.type) where.type = query.type;
    if (query.q) where.contenu = ILike(`%${query.q}%`);

    const [items, total] = await this.publicationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['entreprise', 'auteur'],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     MES PUBLICATIONS (dirigeant)
     ============================================ */
  async findMesPublications(user: any, query: QueryPublicationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Récupérer les entreprises du dirigeant
    const entreprises = await this.entrepriseRepository.find({
      where: { dirigeantId: user.id },
      select: ['id'],
    });
    const ids = entreprises.map((e) => e.id);

    if (ids.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const where: any = { entrepriseId: ids[0] }; // À améliorer si plusieurs
    if (query.type) where.type = query.type;

    const [items, total] = await this.publicationRepository.findAndCount({
      where,
      order: { epingle: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['auteur'],
    });

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     DÉTAIL
     ============================================ */
  async findOne(id: number, user?: any) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
      relations: ['entreprise', 'auteur'],
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    // Si la publication est privée, seuls l'auteur, l'admin et le mentor voient
    if (publication.visibilite === VisibilitePublicationEnum.PRIVE) {
      if (!user || (user.role !== 'ADMIN' && publication.auteurId !== user.id)) {
        throw new ForbiddenException('Accès refusé à cette publication');
      }
    }

    return publication;
  }

  /* ============================================
     CRÉATION
     ============================================ */
  async create(dto: CreatePublicationDto, user: any) {
    // Vérifier l'entreprise
    const entreprise = await this.entrepriseRepository.findOne({
      where: { id: dto.entrepriseId },
    });
    if (!entreprise) {
      throw new NotFoundException(`Entreprise ${dto.entrepriseId} introuvable`);
    }

    // Autorisation
    if (user.role !== 'ADMIN' && entreprise.dirigeantId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez pas publier pour cette entreprise',
      );
    }

    const publication = this.publicationRepository.create({
      entrepriseId: dto.entrepriseId,
      auteurId: user.id,
      type: dto.type || TypePublicationEnum.POST_MANUEL,
      titre: dto.titre || null,
      contenu: dto.contenu,
      image: dto.image || null,
      fichier: dto.fichier || null,
      visibilite: dto.visibilite || VisibilitePublicationEnum.PUBLIC,
      likes: [],
      commentaires: [],
    } as any);

    const saved = await this.publicationRepository.save(publication);

    // Incrémenter le compteur de publications de l'entreprise
    await this.entrepriseRepository.increment(
      { id: dto.entrepriseId },
      'nbPublications',
      1,
    );

    return saved;
  }

  /* ============================================
     MISE À JOUR
     ============================================ */
  async update(id: number, dto: UpdatePublicationDto, user: any) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    if (user.role !== 'ADMIN' && publication.auteurId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette publication');
    }

    Object.assign(publication, dto);
    return this.publicationRepository.save(publication);
  }

  /* ============================================
     SUPPRESSION
     ============================================ */
  async remove(id: number, user: any) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    if (user.role !== 'ADMIN' && publication.auteurId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cette publication');
    }

    // Décrémenter compteur
    if (publication.entrepriseId) {
      await this.entrepriseRepository.decrement(
        { id: publication.entrepriseId },
        'nbPublications',
        1,
      );
    }

    await this.publicationRepository.remove(publication);
    return { message: 'Publication supprimée avec succès' };
  }

  /* ============================================
     LIKE / UNLIKE
     ============================================ */
  async toggleLike(id: number, user: any) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    const likes = publication.likes || [];
    const alreadyLiked = likes.includes(user.id);

    if (alreadyLiked) {
      publication.likes = likes.filter((uid) => uid !== user.id);
    } else {
      publication.likes = [...likes, user.id];
    }
    publication.nbLikes = publication.likes.length;

    await this.publicationRepository.save(publication);

    return {
      liked: !alreadyLiked,
      nbLikes: publication.nbLikes,
    };
  }

  /* ============================================
     COMMENTAIRES
     ============================================ */
  async ajouterCommentaire(
    id: number,
    dto: CreateCommentaireDto,
    user: any,
  ) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    const commentaires = publication.commentaires || [];
    const newCommentaire: Commentaire = {
      id: Date.now(), // ID temporaire, à remplacer par un vrai ID si besoin
      auteur_id: user.id,
      auteur_nom: `${user.prenom} ${user.nom}`,
      auteur_photo: user.photoProfil || undefined,
      contenu: dto.contenu,
      date: new Date().toISOString(),
    };

    publication.commentaires = [...commentaires, newCommentaire];
    publication.nbCommentaires = publication.commentaires.length;

    await this.publicationRepository.save(publication);

    return newCommentaire;
  }

  async supprimerCommentaire(
    publicationId: number,
    commentId: number,
    user: any,
  ) {
    const publication = await this.publicationRepository.findOne({
      where: { id: publicationId },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${publicationId} introuvable`);
    }

    const commentaires = publication.commentaires || [];
    const commentaire = commentaires.find((c) => c.id === commentId);

    if (!commentaire) {
      throw new NotFoundException(`Commentaire ${commentId} introuvable`);
    }

    // Autorisation : auteur du commentaire ou admin
    if (user.role !== 'ADMIN' && commentaire.auteur_id !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce commentaire');
    }

    publication.commentaires = commentaires.filter((c) => c.id !== commentId);
    publication.nbCommentaires = publication.commentaires.length;

    await this.publicationRepository.save(publication);

    return { message: 'Commentaire supprimé avec succès' };
  }

  /* ============================================
     ÉPINGLER / DÉSÉPINGLER
     ============================================ */
  async toggleEpingle(id: number, user: any) {
    const publication = await this.publicationRepository.findOne({
      where: { id },
    });
    if (!publication) {
      throw new NotFoundException(`Publication ${id} introuvable`);
    }

    if (user.role !== 'ADMIN' && publication.auteurId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas épingler cette publication');
    }

    publication.epingle = !publication.epingle;
    await this.publicationRepository.save(publication);

    return {
      epingle: publication.epingle,
      message: publication.epingle ? 'Publication épinglée' : 'Publication désépinglée',
    };
  }

  /* ============================================
     INCRÉMENTER VUES
     ============================================ */
  async incrementVues(id: number) {
    await this.publicationRepository.increment({ id }, 'nbVues', 1);
    return { message: 'Vue enregistrée' };
  }

  /* ============================================
     STATISTIQUES ADMIN
     ============================================ */
  async getStats() {
    const total = await this.publicationRepository.count();
    const publiques = await this.publicationRepository.count({
      where: { visibilite: VisibilitePublicationEnum.PUBLIC },
    });
    const epinglees = await this.publicationRepository.count({
      where: { epingle: true },
    });

    const totalLikes = await this.publicationRepository
      .createQueryBuilder('p')
      .select('SUM(p.nbLikes)', 'sum')
      .getRawOne();

    const totalCommentaires = await this.publicationRepository
      .createQueryBuilder('p')
      .select('SUM(p.nbCommentaires)', 'sum')
      .getRawOne();

    return {
      total,
      publiques,
      epinglees,
      totalLikes: Number(totalLikes?.sum || 0),
      totalCommentaires: Number(totalCommentaires?.sum || 0),
    };
  }
}