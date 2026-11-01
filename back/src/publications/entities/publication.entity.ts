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

export enum TypePublicationEnum {
  SYSTEME = 'SYSTEME',
  POST_MANUEL = 'POST_MANUEL',
  RAPPEL = 'RAPPEL',
  DIAGNOSTIC = 'DIAGNOSTIC',
  MENTORAT = 'MENTORAT',
  COLLABORATION = 'COLLABORATION',
  COTA = 'COTA',
  VALIDATION = 'VALIDATION',
  PRODUIT = 'PRODUIT',
  ACTUALITE = 'ACTUALITE',
}

export enum VisibilitePublicationEnum {
  PUBLIC = 'PUBLIC',
  MENTOR = 'MENTOR',
  PRIVE = 'PRIVE',
}

export interface Commentaire {
  id: number;
  auteur_id: number;
  auteur_nom: string;
  auteur_photo?: string;
  contenu: string;
  date: string;
}

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entreprise_id' })
  entrepriseId: number;

  @ManyToOne(() => Entreprise, (e) => e.publications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entreprise_id' })
  entreprise: Entreprise;

  @Column({ name: 'auteur_id', type: 'int', nullable: true })
  auteurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'auteur_id' })
  auteur: User;

  @Column({ type: 'enum', enum: TypePublicationEnum })
  type: TypePublicationEnum;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titre: string | null;

  @Column({ type: 'text', nullable: true })
  contenu: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fichier: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({
    type: 'enum',
    enum: VisibilitePublicationEnum,
    default: VisibilitePublicationEnum.PUBLIC,
  })
  visibilite: VisibilitePublicationEnum;

  @Column({ type: 'boolean', default: false })
  epingle: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  likes: number[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  commentaires: Commentaire[];

  @Column({ name: 'nb_likes', type: 'int', default: 0 })
  nbLikes: number;

  @Column({ name: 'nb_commentaires', type: 'int', default: 0 })
  nbCommentaires: number;

  @Column({ name: 'nb_vues', type: 'int', default: 0 })
  nbVues: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}