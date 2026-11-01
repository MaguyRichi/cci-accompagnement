import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Entreprise } from '../../entreprises/entities/entreprise.entity';
import { Demande } from '../../demandes/entities/demande.entity';

export enum CategorieDocumentEnum {
  NIF = 'NIF',
  STAT = 'STAT',
  RCS = 'RCS',
  CNAPS = 'CNaPS',
  CV_MENTOR = 'CV_MENTOR',
  DIPLOME = 'DIPLOME',
  RECU_COTA = 'RECU_COTA',
  RAPPORT_DIAGNOSTIC = 'RAPPORT_DIAGNOSTIC',
  BILAN = 'BILAN',
  BROCHURE = 'BROCHURE',
  PHOTO_ENTREPRISE = 'PHOTO_ENTREPRISE',
  PHOTO_PRODUIT = 'PHOTO_PRODUIT',
  LOGO = 'LOGO',
  AUTRE = 'AUTRE',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'demande_id', type: 'int', nullable: true })
  demandeId: number | null;

  @ManyToOne(() => Demande, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'demande_id' })
  demande: Demande;

  @Column({ name: 'entreprise_id', type: 'int', nullable: true })
  entrepriseId: number | null;

  @ManyToOne(() => Entreprise, (e) => e.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entreprise_id' })
  entreprise: Entreprise;

  @Column({ name: 'utilisateur_id', type: 'int', nullable: true })
  utilisateurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'varchar', length: 500 })
  chemin: string;

  @Column({ name: 'type_mime', type: 'varchar', length: 100, nullable: true })
  typeMime: string | null;

  @Column({ type: 'bigint', nullable: true })
  taille: number | null;

  @Column({
    type: 'enum',
    enum: CategorieDocumentEnum,
    default: CategorieDocumentEnum.AUTRE,
  })
  categorie: CategorieDocumentEnum;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /* ============================================
     VALIDATION
     ============================================ */

  @Column({ type: 'boolean', default: false })
  valide: boolean;

  @Column({ name: 'valide_par', type: 'int', nullable: true })
  valideParId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'valide_par' })
  validePar: User;

  @Column({ name: 'date_validation', type: 'timestamp', nullable: true })
  dateValidation: Date | null;

  /* ============================================
     REJET (nouvelles colonnes)
     ============================================ */

  @Column({ name: 'motif_rejet', type: 'text', nullable: true })
  motifRejet: string | null;

  @Column({ name: 'rejete_par', type: 'int', nullable: true })
  rejeteParId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rejete_par' })
  rejetePar: User;

  @Column({ name: 'date_rejet', type: 'timestamp', nullable: true })
  dateRejet: Date | null;

  /* ============================================ */

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}