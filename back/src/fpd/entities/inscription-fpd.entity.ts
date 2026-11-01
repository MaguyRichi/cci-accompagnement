import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionFPD } from './session-fpd.entity';
import { User } from '../../users/entities/user.entity';
import { Entreprise } from '../../entreprises/entities/entreprise.entity';

export enum StatutInscriptionFPDEnum {
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  VALIDEE_PAR_MENTOR = 'VALIDEE_PAR_MENTOR',
  ABANDON = 'ABANDON',
}

@Entity('inscriptions_fpd')
export class InscriptionFPD {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'utilisateur_id', type: 'int' })
  utilisateurId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ name: 'entreprise_id', type: 'int', nullable: true })
  entrepriseId: number | null;

  @ManyToOne(() => Entreprise, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'entreprise_id' })
  entreprise: Entreprise | null;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @ManyToOne(() => SessionFPD, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionFPD;

  @Column({
    type: 'varchar',
    length: 30,
    default: StatutInscriptionFPDEnum.EN_COURS,
  })
  statut: StatutInscriptionFPDEnum;

  // ⚠️ CHAMPS CALCULÉS À LA VOLÉE, PAS PERSISTÉS
  progression?: number = 0;
  totalQuizzes?: number = 0;
  completedQuizzes?: number = 0;

  /* ===== Validation par le mentor ===== */

  @Column({ name: 'mentor_validateur_id', type: 'int', nullable: true })
  mentorValidateurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mentor_validateur_id' })
  mentorValidateur: User | null;

  @Column({ name: 'date_validation_mentor', type: 'timestamp', nullable: true })
  dateValidationMentor: Date | null;

  @Column({
    name: 'note_mentor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  noteMentor: number | null;

  @Column({ name: 'commentaire_mentor', type: 'text', nullable: true })
  commentaireMentor: string | null;

  /* ===== Badge et certificat ===== */

  @Column({ name: 'badge_obtenu', type: 'varchar', length: 150, nullable: true })
  badgeObtenu: string | null;

  @Column({ name: 'date_badge', type: 'timestamp', nullable: true })
  dateBadge: Date | null;

  @Column({
    name: 'certificat_numero',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  certificatNumero: string | null;

  @Column({ name: 'certificat_genere_at', type: 'timestamp', nullable: true })
  certificatGenereAt: Date | null;

  /* ===== Dates ===== */

  @Column({ name: 'date_debut', type: 'date', nullable: true })
  dateDebut: Date | null;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}