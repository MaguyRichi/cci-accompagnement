import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { TypeNotificationEnum } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /* ============================================
     LISTE
     ============================================ */
  async findAll(query: QueryDocumentDto, user: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.categorie) where.categorie = query.categorie;
    if (query.entrepriseId)
      where.entrepriseId = parseInt(String(query.entrepriseId), 10);
    if (query.demandeId)
      where.demandeId = parseInt(String(query.demandeId), 10);
    if (query.valide === 'true') where.valide = true;
    if (query.valide === 'false') where.valide = false;

    if (user.role !== 'ADMIN') {
      where.utilisateurId = user.id;
    }

    const [items, total] = await this.documentRepository.findAndCount({
      where,
      relations: ['utilisateur', 'entreprise', 'demande'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = items.map((doc) => this.sanitize(doc));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ============================================
     DÉTAIL
     ============================================ */
  async findOne(id: number, user: any) {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['utilisateur', 'entreprise', 'demande'],
    });

    if (!doc) {
      throw new NotFoundException(`Document ${id} introuvable`);
    }

    if (user.role !== 'ADMIN' && doc.utilisateurId !== user.id) {
      throw new ForbiddenException('Accès refusé à ce document');
    }

    return this.sanitize(doc);
  }

  /* ============================================
     CRÉER — + notification aux admins
     ============================================ */
  async create(dto: CreateDocumentDto, user: any): Promise<Document> {
    const doc = this.documentRepository.create({
      nom: dto.nom,
      chemin: dto.chemin,
      typeMime: dto.typeMime || null,
      taille: dto.taille || null,
      categorie: (dto.categorie as any) || 'AUTRE',
      description: dto.description || null,
      demandeId: dto.demandeId || null,
      entrepriseId: dto.entrepriseId || null,
      utilisateurId: user.id,
      valide: false,
    } as any);

    const raw = await this.documentRepository.save(doc);
    // ✅ Sécurité : TypeORM peut renvoyer un tableau selon le contexte
    const saved: Document = Array.isArray(raw) ? raw[0] : raw;

    // 🔔 Notifier tous les admins
    try {
      const admins = await this.userRepository.find({
        where: { role: 'ADMIN' as any, actif: true },
        select: ['id'],
      });

      const nomUser =
        (user as any)?.prenom && (user as any)?.nom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as any)?.email || 'Un utilisateur';

      for (const admin of admins) {
        await this.notificationsService.create({
          utilisateurId: admin.id,
          titre: ' Nouveau document à valider',
          message: `${nomUser} a téléversé "${saved.nom}" (${saved.categorie}).`,
          type: TypeNotificationEnum.RAPPEL,
          lien: '/admin/documents',
          icone: 'document',
        } as any);
      }
    } catch (err) {
      this.logger.error('Erreur notification admins (document):', err);
    }

    return this.sanitize(saved);
  }

  /* ============================================
     VALIDER
     ============================================ */
  async valider(id: number, adminId: number) {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} introuvable`);

    if (doc.valide) {
      throw new BadRequestException('Ce document est déjà validé.');
    }

    doc.valide = true;
    doc.valideParId = adminId;
    doc.dateValidation = new Date();
    doc.motifRejet = null;
    doc.rejeteParId = null;
    doc.dateRejet = null;

    const saved = await this.documentRepository.save(doc);

    if (saved.utilisateurId) {
      try {
        await this.notificationsService.create({
          utilisateurId: saved.utilisateurId,
          titre: ' Document validé',
          message: `Votre document "${saved.nom}" a été validé par la CCI.`,
          type: TypeNotificationEnum.VALIDATION,
          lien: '/pme/profil',
          icone: 'check',
        } as any);
      } catch (err) {
        this.logger.error('Erreur notification validation:', err);
      }
    }

    return this.sanitize(saved);
  }

  /* ============================================
     REJETER
     ============================================ */
  async rejeter(id: number, motif: string, adminId?: number) {
    if (!motif || !motif.trim()) {
      throw new BadRequestException('Le motif de rejet est obligatoire.');
    }

    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} introuvable`);

    doc.valide = false;
    doc.motifRejet = motif.trim();
    doc.rejeteParId = adminId ?? null;
    doc.dateRejet = new Date();
    doc.valideParId = null;
    doc.dateValidation = null;

    const saved = await this.documentRepository.save(doc);

    if (saved.utilisateurId) {
      try {
        await this.notificationsService.create({
          utilisateurId: saved.utilisateurId,
          titre: ' Document rejeté',
          message: `Votre document "${saved.nom}" a été rejeté. Motif : ${motif}`,
          type: TypeNotificationEnum.ALERTE,
          lien: '/pme/profil',
          icone: 'alert',
        } as any);
      } catch (err) {
        this.logger.error('Erreur notification rejet:', err);
      }
    }

    return this.sanitize(saved);
  }

  /* ============================================
     SUPPRIMER
     ============================================ */
  async remove(id: number, user: any) {
    const doc = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && (doc as any).valide) {
      throw new ForbiddenException(
        'Un document validé ne peut pas être supprimé par son propriétaire.',
      );
    }

    await this.documentRepository.remove(doc as any);
    return { message: 'Document supprimé' };
  }

  /* ============================================
     DOCUMENTS PUBLICS D'UNE ENTREPRISE
     ============================================ */
  async findByEntreprise(entrepriseId: number) {
    const items = await this.documentRepository.find({
      where: { entrepriseId, valide: true },
      relations: ['utilisateur'],
      order: { createdAt: 'DESC' },
    });

    return items.map((doc) => this.sanitize(doc));
  }

  /* ============================================
     MES DOCUMENTS (dirigeant connecté)
     ============================================ */
  async findMesDocuments(user: any) {
    const items = await this.documentRepository.find({
      where: { utilisateurId: user.id },
      relations: ['entreprise'],
      order: { createdAt: 'DESC' },
    });

    return items.map((doc) => this.sanitize(doc));
  }

  /* ============================================
     STATISTIQUES
     ============================================ */
  async getStats() {
    const total = await this.documentRepository.count();
    const valides = await this.documentRepository.count({
      where: { valide: true },
    });
    const enAttente = await this.documentRepository.count({
      where: { valide: false },
    });

    return { total, valides, enAttente };
  }

  /* ============================================
     UTIL — retirer le hash
     ============================================ */
  private sanitize(doc: Document): any {
    if (!doc) return doc;
    const clone: any = { ...doc };

    if (clone.utilisateur) {
      const { motDePasseHash, motDePasse, password, ...rest } = clone.utilisateur;
      clone.utilisateur = rest;
    }
    return clone;
  }
}