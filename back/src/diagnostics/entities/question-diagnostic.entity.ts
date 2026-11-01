import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum TypeQuestionEnum {
  NOTE = 'NOTE',
  OUI_NON = 'OUI_NON',
  CHOIX = 'CHOIX',
  TEXTE = 'TEXTE',
}

@Entity('questions_diagnostic')
export class QuestionDiagnostic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  categorie: string;

  @Column({ name: 'sous_categorie', type: 'varchar', length: 100, nullable: true })
  sousCategorie: string | null;

  @Column({ type: 'text' })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'type_reponse', type: 'enum', enum: TypeQuestionEnum, default: TypeQuestionEnum.NOTE })
  typeReponse: TypeQuestionEnum;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  options: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  poids: number;

  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Column({ type: 'boolean', default: true })
  obligatoire: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}