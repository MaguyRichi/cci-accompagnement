import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export enum TypeMessageEnum {
  TEXTE = 'TEXTE',
  FICHIER = 'FICHIER',
  IMAGE = 'IMAGE',
  RDV = 'RDV',
  SYSTEME = 'SYSTEME',
}

export enum StatutRdvMessageEnum {
  PROPOSE = 'PROPOSE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversation_id' })
  conversationId: number;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'expediteur_id', type: 'int', nullable: true })
  expediteurId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'expediteur_id' })
  expediteur: User;

  @Column({ type: 'enum', enum: TypeMessageEnum, default: TypeMessageEnum.TEXTE })
  type: TypeMessageEnum;

  @Column({ type: 'text', nullable: true })
  contenu: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fichier: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ name: 'date_rdv', type: 'timestamp', nullable: true })
  dateRdv: Date | null;

  @Column({ name: 'lieu_rdv', type: 'varchar', length: 200, nullable: true })
  lieuRdv: string | null;

  @Column({ name: 'rdv_statut', type: 'enum', enum: StatutRdvMessageEnum, nullable: true })
  rdvStatut: StatutRdvMessageEnum | null;

  @Column({ type: 'boolean', default: false })
  lu: boolean;

  @Column({ name: 'lu_at', type: 'timestamp', nullable: true })
  luAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}