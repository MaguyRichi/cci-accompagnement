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

export enum TypeDiagnosticEnum {
  ACCOMPAGNE = 'ACCOMPAGNE',
  AUTO_EVALUATION = 'AUTO_EVALUATION',
}

export enum NiveauDiagnosticEnum {
  DEBUTANT = 'DEBUTANT',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  AVANCE = 'AVANCE',
  EXCELLENCE = 'EXCELLENCE',
}

export enum StatutDiagnosticEnum {
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  VALIDE = 'VALIDE',
}

export interface Recommandation {
  axe: string;
  priorite: number;
  impact: string;
  titre: string;
  description: string;
}

@Entity('diagnostics')
export class Diagnostic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entreprise_id' })
  entrepriseId: number;

  @ManyToOne(() => Entreprise, (e) => e.diagnostics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entreprise_id' })
  entreprise: Entreprise;

  @Column({ name: 'conseiller_id', type: 'int', nullable: true })
  conseillerId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conseiller_id' })
  conseiller: User;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  reference: string | null;

  @Column({ type: 'enum', enum: TypeDiagnosticEnum, default: TypeDiagnosticEnum.ACCOMPAGNE })
  type: TypeDiagnosticEnum;

  @Column({ name: 'score_global', type: 'decimal', precision: 5, scale: 2, nullable: true })
  scoreGlobal: number | null;

  @Column({ type: 'enum', enum: NiveauDiagnosticEnum, nullable: true })
  niveau: NiveauDiagnosticEnum | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  reponses: Record<string, any>;

  @Column({ name: 'scores_par_categorie', type: 'jsonb', default: () => "'{}'::jsonb" })
  scoresParCategorie: Record<string, number>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  recommandations: Recommandation[];

  @Column({ name: 'points_forts', type: 'jsonb', default: () => "'[]'::jsonb" })
  pointsForts: string[];

  @Column({ name: 'points_ameliorer', type: 'jsonb', default: () => "'[]'::jsonb" })
  pointsAmeliorer: string[];

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @Column({ type: 'enum', enum: StatutDiagnosticEnum, default: StatutDiagnosticEnum.TERMINE })
  statut: StatutDiagnosticEnum;

  @Column({ name: 'valide_par', type: 'int', nullable: true })
  valideParId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'valide_par' })
  validePar: User;

  @Column({ name: 'date_validation', type: 'timestamp', nullable: true })
  dateValidation: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}