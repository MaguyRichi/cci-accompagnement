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
import { Entreprise } from '../../entreprises/entities/entreprise.entity';
import { Demande } from '../../demandes/entities/demande.entity';
import { Message } from '../../messages/entities/message.entity';

export enum TypeConversationEnum {
  MENTORAT = 'MENTORAT',
  COLLABORATION = 'COLLABORATION',
}

export enum StatutConversationEnum {
  ACTIVE = 'ACTIVE',
  ARCHIVEE = 'ARCHIVEE',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TypeConversationEnum })
  type: TypeConversationEnum;

  @Column({ name: 'demandeur_id', type: 'int', nullable: true })
  demandeurId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'demandeur_id' })
  demandeur: User;

  @Column({ name: 'destinataire_id', type: 'int', nullable: true })
  destinataireId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinataire_id' })
  destinataire: User;

  @Column({ name: 'entreprise_a_id', type: 'int', nullable: true })
  entrepriseAId: number | null;

  @ManyToOne(() => Entreprise, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'entreprise_a_id' })
  entrepriseA: Entreprise;

  @Column({ name: 'entreprise_b_id', type: 'int', nullable: true })
  entrepriseBId: number | null;

  @ManyToOne(() => Entreprise, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'entreprise_b_id' })
  entrepriseB: Entreprise;

  @Column({ name: 'demande_id', type: 'int', nullable: true })
  demandeId: number | null;

  @ManyToOne(() => Demande, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'demande_id' })
  demande: Demande;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sujet: string | null;

  @Column({ name: 'dernier_message', type: 'text', nullable: true })
  dernierMessage: string | null;

  @Column({ name: 'dernier_message_at', type: 'timestamp', nullable: true })
  dernierMessageAt: Date | null;

  @Column({ name: 'nb_non_lus_a', type: 'int', default: 0 })
  nbNonLusA: number;

  @Column({ name: 'nb_non_lus_b', type: 'int', default: 0 })
  nbNonLusB: number;

  @Column({ type: 'enum', enum: StatutConversationEnum, default: StatutConversationEnum.ACTIVE })
  statut: StatutConversationEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}