import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Entreprise } from '../../entreprises/entities/entreprise.entity';

export enum TypeDemandeEnum {
  INSCRIPTION_DIRIGEANT = 'INSCRIPTION_DIRIGEANT',
  INSCRIPTION_MENTOR = 'INSCRIPTION_MENTOR',
  MENTORAT = 'MENTORAT',
  COLLABORATION = 'COLLABORATION',
  RDV = 'RDV',
}

export enum SousTypeCollabEnum {
  OFFRE = 'OFFRE',
  DEMANDE = 'DEMANDE',
  PARTENARIAT = 'PARTENARIAT',
}

export enum StatutDemandeEnum {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDEE = 'VALIDEE',
  REFUSEE = 'REFUSEE',
  RDV_DEMANDE = 'RDV_DEMANDE',
  ACCEPTEE = 'ACCEPTEE',
  REFUSEE_PAR_CIBLE = 'REFUSEE_PAR_CIBLE',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
}

@Entity('demandes')
export class Demande {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TypeDemandeEnum })
  type: TypeDemandeEnum;

  @Column({ name: 'sous_type', type: 'enum', enum: SousTypeCollabEnum, nullable: true })
  sousType: SousTypeCollabEnum | null;

  @Column({ name: 'emetteur_id', type: 'int', nullable: true })
  emetteurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'emetteur_id' })
  emetteur: User;

  @Column({ name: 'entreprise_id', type: 'int', nullable: true })
  entrepriseId: number | null;

  @ManyToOne(() => Entreprise, (e) => e.demandes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entreprise_id' })
  entreprise: Entreprise;

  @Column({ name: 'cible_id', type: 'int', nullable: true })
  cibleId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cible_id' })
  cible: User;

  @Column({ name: 'cible_entreprise_id', type: 'int', nullable: true })
  cibleEntrepriseId: number | null;

  @ManyToOne(() => Entreprise, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cible_entreprise_id' })
  cibleEntreprise: Entreprise;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titre: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'besoin_detaille', type: 'text', nullable: true })
  besoinDetaille: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  volume: string | null;

  @Column({ name: 'localisation_cible', type: 'varchar', length: 200, nullable: true })
  localisationCible: string | null;

  @Column({ name: 'secteur_concerne', type: 'varchar', length: 100, nullable: true })
  secteurConcerne: string | null;

  @Column({ name: 'date_souhaitee', type: 'timestamp', nullable: true })
  dateSouhaitee: Date | null;

  @Column({ name: 'duree_estimee', type: 'varchar', length: 100, nullable: true })
  dureeEstimee: string | null;

  @Column({ type: 'enum', enum: StatutDemandeEnum, default: StatutDemandeEnum.EN_ATTENTE })
  statut: StatutDemandeEnum;

  @Column({ name: 'motif_refus', type: 'text', nullable: true })
  motifRefus: string | null;

  @Column({ name: 'traite_par', type: 'int', nullable: true })
  traiteParId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'traite_par' })
  traitePar: User;

  @Column({ name: 'date_traitement', type: 'timestamp', nullable: true })
  dateTraitement: Date | null;

  // ⭐ Évaluation
  @Column({ type: 'int', nullable: true })
  note: number | null;

  @Column({ name: 'commentaire_evaluation', type: 'text', nullable: true })
  commentaireEvaluation: string | null;

  @Column({ name: 'date_evaluation', type: 'timestamp', nullable: true })
  dateEvaluation: Date | null;

  // Visibilité
  @Column({ name: 'visible_publiquement', type: 'boolean', default: false })
  visiblePubliquement: boolean;

  @Column({ name: 'date_publication', type: 'timestamp', nullable: true })
  datePublication: Date | null;

  @Column({ name: 'date_cloture', type: 'timestamp', nullable: true })
  dateCloture: Date | null;

  @Column({ name: 'pieces_jointes', type: 'jsonb', default: () => "'[]'::jsonb" })
  piecesJointes: { nom: string; url: string }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}