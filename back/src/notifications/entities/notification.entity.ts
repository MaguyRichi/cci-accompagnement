import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TypeNotificationEnum {
  INFO = 'INFO',
  ALERTE = 'ALERTE',
  RAPPEL = 'RAPPEL',
  VALIDATION = 'VALIDATION',
  MESSAGE = 'MESSAGE',
  COTA = 'COTA',
  RDV = 'RDV',
  MENTORAT = 'MENTORAT',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'utilisateur_id' })
  utilisateurId: number;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: User;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titre: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'enum', enum: TypeNotificationEnum, default: TypeNotificationEnum.INFO })
  type: TypeNotificationEnum;

  @Column({ type: 'varchar', length: 300, nullable: true })
  lien: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icone: string | null;

  @Column({ name: 'email_envoye', type: 'boolean', default: false })
  emailEnvoye: boolean;

  @Column({ name: 'email_envoye_at', type: 'timestamp', nullable: true })
  emailEnvoyeAt: Date | null;

  @Column({ name: 'sms_envoye', type: 'boolean', default: false })
  smsEnvoye: boolean;

  @Column({ name: 'sms_envoye_at', type: 'timestamp', nullable: true })
  smsEnvoyeAt: Date | null;

  @Column({ type: 'boolean', default: false })
  lu: boolean;

  @Column({ name: 'lu_at', type: 'timestamp', nullable: true })
  luAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}