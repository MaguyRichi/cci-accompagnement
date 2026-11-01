import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { Demande } from '../demandes/entities/demande.entity';
import { Document } from '../documents/entities/document.entity';
import { Diagnostic } from '../diagnostics/entities/diagnostic.entity';
import { Publication } from '../publications/entities/publication.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
    @InjectRepository(Demande)
    private readonly demandeRepository: Repository<Demande>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Diagnostic)
    private readonly diagnosticRepository: Repository<Diagnostic>,
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  /* ============================================
     KPI GLOBAUX
     ============================================ */
  async getKpis() {
    const [
      totalUsers,
      totalEntreprises,
      entreprisesActives,
      totalDemandes,
      demandesEnAttente,
      documentsAValider,
      totalDiagnostics,
      mentorsActifs,
    ] = await Promise.all([
      this.userRepository.count(),
      this.entrepriseRepository.count(),
      this.entrepriseRepository.count({
        where: { statut: 'ACTIF' as any },
      }),
      this.demandeRepository.count(),
      this.demandeRepository.count({
        where: { statut: 'EN_ATTENTE' as any },
      }),
      this.documentRepository.count({ where: { valide: false } }),
      this.diagnosticRepository.count(),
      this.userRepository.count({
        where: { role: 'MENTOR' as any, actif: true },
      }),
    ]);

    return {
      totalUsers,
      totalEntreprises,
      entreprisesActives,
      totalDemandes,
      demandesEnAttente,
      documentsAValider,
      totalDiagnostics,
      mentorsActifs,
    };
  }

  /* ============================================
     INSCRIPTIONS PAR MOIS (12 derniers mois)
     ============================================ */
  async getInscriptionsParMois() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const userRows: { mois: string; count: string }[] = await this.userRepository
      .createQueryBuilder('u')
      .select("TO_CHAR(u.created_at, 'YYYY-MM')", 'mois')
      .addSelect('COUNT(*)', 'count')
      .where('u.created_at >= :date', { date: twelveMonthsAgo })
      .groupBy("TO_CHAR(u.created_at, 'YYYY-MM')")
      .orderBy('mois', 'ASC')
      .getRawMany();

    const entrepriseRows: { mois: string; count: string }[] = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select("TO_CHAR(e.created_at, 'YYYY-MM')", 'mois')
      .addSelect('COUNT(*)', 'count')
      .where('e.created_at >= :date', { date: twelveMonthsAgo })
      .groupBy("TO_CHAR(e.created_at, 'YYYY-MM')")
      .orderBy('mois', 'ASC')
      .getRawMany();

    // Construire les 12 derniers mois (même vides)
    const months: { mois: string; label: string; utilisateurs: number; entreprises: number }[] = [];
    const MOIS_FR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MOIS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

      const u = userRows.find((r) => r.mois === moisKey);
      const e = entrepriseRows.find((r) => r.mois === moisKey);

      months.push({
        mois: moisKey,
        label,
        utilisateurs: u ? Number(u.count) : 0,
        entreprises: e ? Number(e.count) : 0,
      });
    }

    return months;
  }

  /* ============================================
     ENTREPRISES PAR SECTEUR (top 8)
     ============================================ */
  async getEntreprisesParSecteur() {
    const rows: { secteur: string; count: string }[] = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('e.secteur', 'secteur')
      .addSelect('COUNT(*)', 'count')
      .where('e.secteur IS NOT NULL')
      .andWhere("e.secteur != ''")
      .groupBy('e.secteur')
      .orderBy('count', 'DESC')
      .limit(8)
      .getRawMany();

    return rows.map((r) => ({
      secteur: r.secteur,
      count: Number(r.count),
    }));
  }

  /* ============================================
     TOP VILLES (5)
     ============================================ */
  async getTopVilles() {
    const rows: { ville: string; count: string }[] = await this.entrepriseRepository
      .createQueryBuilder('e')
      .select('e.ville', 'ville')
      .addSelect('COUNT(*)', 'count')
      .where('e.ville IS NOT NULL')
      .andWhere("e.ville != ''")
      .groupBy('e.ville')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return rows.map((r) => ({
      ville: r.ville,
      count: Number(r.count),
    }));
  }

  /* ============================================
     UTILISATEURS PAR RÔLE
     ============================================ */
  async getUsersParRole() {
    const rows: { role: string; count: string }[] = await this.userRepository
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany();

    const LABELS: Record<string, string> = {
      ADMIN: 'Administrateurs',
      DIRIGEANT: 'Dirigeants',
      MENTOR: 'Mentors',
    };

    return rows.map((r) => ({
      role: r.role,
      label: LABELS[r.role] || r.role,
      count: Number(r.count),
    }));
  }

  /* ============================================
     DIAGNOSTICS PAR NIVEAU
     ============================================ */
  async getDiagnosticsParNiveau() {
    const rows: { niveau: string; count: string }[] = await this.diagnosticRepository
      .createQueryBuilder('d')
      .select('d.niveau', 'niveau')
      .addSelect('COUNT(*)', 'count')
      .where('d.niveau IS NOT NULL')
      .groupBy('d.niveau')
      .getRawMany();

    const LABELS: Record<string, string> = {
      DEBUTANT: 'Débutant',
      INTERMEDIAIRE: 'Intermédiaire',
      AVANCE: 'Avancé',
      EXCELLENCE: 'Excellence',
    };

    return rows.map((r) => ({
      niveau: r.niveau,
      label: LABELS[r.niveau] || r.niveau,
      count: Number(r.count),
    }));
  }

  /* ============================================
     DEMANDES PAR TYPE
     ============================================ */
  async getDemandesParType() {
    const rows: { type: string; count: string }[] = await this.demandeRepository
      .createQueryBuilder('d')
      .select('d.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('d.type')
      .getRawMany();

    const LABELS: Record<string, string> = {
      INSCRIPTION_DIRIGEANT: 'Inscriptions dirigeants',
      INSCRIPTION_MENTOR: 'Inscriptions mentors',
      MENTORAT: 'Mentorats',
      COLLABORATION: 'Collaborations',
      RDV: 'Rendez-vous',
    };

    return rows.map((r) => ({
      type: r.type,
      label: LABELS[r.type] || r.type,
      count: Number(r.count),
    }));
  }

  /* ============================================
     DERNIÈRES INSCRIPTIONS (5)
     ============================================ */
  async getDernieresInscriptions() {
    const users = await this.userRepository.find({
      select: ['id', 'nom', 'prenom', 'email', 'role', 'createdAt', 'actif', 'photoProfil'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    return users;
  }

  /* ============================================
     DEMANDES EN ATTENTE (5)
     ============================================ */
  async getDemandesEnAttente() {
    const demandes = await this.demandeRepository.find({
      where: { statut: 'EN_ATTENTE' as any },
      relations: ['emetteur', 'entreprise'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    return demandes;
  }

  /* ============================================
     TOUT EN UN SEUL APPEL
     ============================================ */
  async getAll() {
    const [
      kpis,
      inscriptionsParMois,
      entreprisesParSecteur,
      topVilles,
      usersParRole,
      diagnosticsParNiveau,
      demandesParType,
      dernieresInscriptions,
      demandesEnAttente,
    ] = await Promise.all([
      this.getKpis(),
      this.getInscriptionsParMois(),
      this.getEntreprisesParSecteur(),
      this.getTopVilles(),
      this.getUsersParRole(),
      this.getDiagnosticsParNiveau(),
      this.getDemandesParType(),
      this.getDernieresInscriptions(),
      this.getDemandesEnAttente(),
    ]);

    return {
      kpis,
      inscriptionsParMois,
      entreprisesParSecteur,
      topVilles,
      usersParRole,
      diagnosticsParNiveau,
      demandesParType,
      dernieresInscriptions,
      demandesEnAttente,
    };
  }
}