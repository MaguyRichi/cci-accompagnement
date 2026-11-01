import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InscriptionFPD } from './inscription-fpd.entity';
import { MetierFPDEnum, StatutSessionEnum } from './enums';
import { User } from '../../users/entities/user.entity';

@Entity('sessions_fpd')
export class SessionFPD {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'enum', enum: MetierFPDEnum })
  metier: MetierFPDEnum;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'date_debut', type: 'date' })
  dateDebut: Date;

  @Column({ name: 'date_fin', type: 'date' })
  dateFin: Date;

  @Column({ name: 'places_totales', type: 'int', default: 20 })
  placesTotales: number;

  @Column({ name: 'places_restantes', type: 'int', default: 20 })
  placesRestantes: number;

  @Column({
    type: 'enum',
    enum: StatutSessionEnum,
    default: StatutSessionEnum.PLANIFIEE,
  })
  statut: StatutSessionEnum;

  @Column({
    name: 'lieu_formation',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  lieuFormation: string | null;

  @Column({ name: 'responsable_id', type: 'int', nullable: true })
  responsableId: number | null;

  @Column({ name: 'pourcentage_pratique', type: 'int', default: 80 })
  pourcentagePratique: number;

  @Column({ name: 'pourcentage_theorique', type: 'int', default: 20 })
  pourcentageTheorique: number;

  // ⬇️ NOUVEAU : Créateur et visibilité privée
  @Column({ name: 'createur_id', type: 'int', nullable: true })
  createurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createur_id' })
  createur: User | null;

  @Column({ name: 'est_privee', type: 'boolean', default: false })
  estPrivee: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InscriptionFPD, (i) => i.session)
  inscriptions: InscriptionFPD[];
}