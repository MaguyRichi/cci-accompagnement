import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Demande } from '../../demandes/entities/demande.entity';
import { Document } from '../../documents/entities/document.entity';
import { Diagnostic } from '../../diagnostics/entities/diagnostic.entity';
import { Publication } from '../../publications/entities/publication.entity';

export enum TailleEnum {
  TPE = 'TPE',
  PE = 'PE',
  ME = 'ME',
}

export enum StatutEntrepriseEnum {
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  INACTIF = 'INACTIF',
}

export enum StatutCotaEnum {
  IMPAYE = 'IMPAYE',
  PAYE = 'PAYE',
  EN_RETARD = 'EN_RETARD',
  EXONERE = 'EXONERE',
}

export enum ModePaiementEnum {
  ESPECES = 'ESPECES',
  MVOLA = 'MVOLA',
  ORANGE_MONEY = 'ORANGE_MONEY',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
}

export interface Produit {
  nom: string;
  prix?: string;
  categorie?: string;
  image?: string;
}

export interface Avis {
  user_id: number;
  auteur_nom: string;
  auteur_photo?: string;
  note: number;
  commentaire: string;
  date: string;
}

export interface CotaHistorique {
  annee: number;
  montant: number;
  statut: string;
  reference: string;
  date_paiement: string;
}

@Entity('entreprises')
export class Entreprise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'raison_sociale', type: 'varchar', length: 200 })
  raisonSociale: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sigle: string | null;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  nif: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stat: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rcs: string | null;

  @Column({ name: 'forme_juridique', type: 'varchar', length: 50, nullable: true })
  formeJuridique: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  secteur: string | null;

  @Column({ name: 'sous_secteur', type: 'varchar', length: 100, nullable: true })
  sousSecteur: string | null;

  @Column({ type: 'enum', enum: TailleEnum, nullable: true })
  taille: TailleEnum | null;

  @Column({ type: 'int', nullable: true })
  effectif: number | null;

  @Column({ name: 'chiffre_affaires', type: 'decimal', precision: 15, scale: 2, nullable: true })
  chiffreAffaires: number | null;

  @Column({ name: 'annee_creation', type: 'date', nullable: true })
  anneeCreation: Date | null;

  // Description
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'produit_phare', type: 'varchar', length: 200, nullable: true })
  produitPhare: string | null;

  @Column({ name: 'liste_produits', type: 'jsonb', default: () => "'[]'::jsonb" })
  listeProduits: Produit[];

  @Column({ name: 'mots_cles', type: 'jsonb', default: () => "'[]'::jsonb" })
  motsCles: string[];

  // Coordonnées
  @Column({ type: 'text', nullable: true })
  adresse: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Haute Matsiatra' })
  region: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'site_web', type: 'varchar', length: 200, nullable: true })
  siteWeb: string | null;

  // Visuels
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ name: 'photo_couverture', type: 'varchar', length: 500, nullable: true })
  photoCouverture: string | null;

  @Column({ name: 'galerie_photos', type: 'jsonb', default: () => "'[]'::jsonb" })
  galeriePhotos: string[];

  // Liens
  @Column({ name: 'dirigeant_id', type: 'int', nullable: true })
  dirigeantId: number | null;

  @ManyToOne(() => User, (u) => u.entreprisesDirigees, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dirigeant_id' })
  dirigeant: User;

  @Column({ name: 'mentor_id', type: 'int', nullable: true })
  mentorId: number | null;

  @ManyToOne(() => User, (u) => u.entreprisesMentorees, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mentor_id' })
  mentor: User;

  // Statut & vérification
  @Column({ type: 'enum', enum: StatutEntrepriseEnum, default: StatutEntrepriseEnum.ACTIF })
  statut: StatutEntrepriseEnum;

  @Column({ name: 'motif_suspension', type: 'text', nullable: true })
  motifSuspension: string | null;

  @Column({ name: 'date_suspension', type: 'timestamp', nullable: true })
  dateSuspension: Date | null;

  @Column({ type: 'boolean', default: false })
  verifie: boolean;

  @Column({ name: 'date_verification', type: 'timestamp', nullable: true })
  dateVerification: Date | null;

  // ⭐ Note / étoiles
  @Column({ name: 'note_moyenne', type: 'decimal', precision: 3, scale: 2, default: 0 })
  noteMoyenne: number;

  @Column({ name: 'nb_avis', type: 'int', default: 0 })
  nbAvis: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  avis: Avis[];

  // 💰 Cota
  @Column({ name: 'cota_montant', type: 'decimal', precision: 15, scale: 2, nullable: true })
  cotaMontant: number | null;

  @Column({ name: 'cota_statut', type: 'enum', enum: StatutCotaEnum, default: StatutCotaEnum.IMPAYE })
  cotaStatut: StatutCotaEnum;

  @Column({ name: 'cota_echeance', type: 'date', nullable: true })
  cotaEcheance: Date | null;

  @Column({ name: 'cota_date_paiement', type: 'date', nullable: true })
  cotaDatePaiement: Date | null;

  @Column({ name: 'cota_reference', type: 'varchar', length: 100, nullable: true })
  cotaReference: string | null;

  @Column({ name: 'cota_mode_paiement', type: 'enum', enum: ModePaiementEnum, nullable: true })
  cotaModePaiement: ModePaiementEnum | null;

  @Column({ name: 'cota_historique', type: 'jsonb', default: () => "'[]'::jsonb" })
  cotaHistorique: CotaHistorique[];

  @Column({ name: 'numero_carte_membre', type: 'varchar', length: 100, nullable: true })
  numeroCarteMembre: string | null;

  // Compteurs
  @Column({ name: 'nb_vues', type: 'int', default: 0 })
  nbVues: number;

  @Column({ name: 'nb_publications', type: 'int', default: 0 })
  nbPublications: number;

  @Column({ name: 'nb_collaborations', type: 'int', default: 0 })
  nbCollaborations: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Demande, (d) => d.entreprise)
  demandes: Demande[];

  @OneToMany(() => Document, (d) => d.entreprise)
  documents: Document[];

  @OneToMany(() => Diagnostic, (d) => d.entreprise)
  diagnostics: Diagnostic[];

  @OneToMany(() => Publication, (p) => p.entreprise)
  publications: Publication[];
}