import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Entreprise } from '../../entreprises/entities/entreprise.entity';
import { Demande } from '../../demandes/entities/demande.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';

export enum RoleEnum {
  ADMIN = 'ADMIN',
  MENTOR = 'MENTOR',
  DIRIGEANT = 'DIRIGEANT',
}

export enum LangueEnum {
  FR = 'FR',
  MG = 'MG',
}

export enum ThemeEnum {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export enum DisponibiliteEnum {
  TEMPS_PLEIN = 'TEMPS_PLEIN',
  TEMPS_PARTIEL = 'TEMPS_PARTIEL',
  OCCASIONNEL = 'OCCASIONNEL',
}

@Entity('utilisateurs')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'mot_de_passe_hash', type: 'varchar', length: 255, nullable: true })
  motDePasseHash: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({ name: 'photo_profil', type: 'varchar', length: 500, nullable: true })
  photoProfil: string | null;

  @Column({ name: 'bio_courte', type: 'text', nullable: true })
  bioCourte: string | null;

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.DIRIGEANT })
  role: RoleEnum;

  // Authentification
  @Column({ name: 'token_activation', type: 'varchar', length: 255, nullable: true })
  tokenActivation: string | null;

  @Column({ name: 'token_expire_at', type: 'timestamp', nullable: true })
  tokenExpireAt: Date | null;

  @Column({ name: 'token_reset', type: 'varchar', length: 255, nullable: true })
  tokenReset: string | null;

  @Column({ name: 'email_verifie', type: 'boolean', default: false })
  emailVerifie: boolean;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @Column({ name: 'derniere_connexion', type: 'timestamp', nullable: true })
  derniereConnexion: Date | null;

  // Profil mentor
  @Column({ name: 'domaine_mentor', type: 'varchar', length: 200, nullable: true })
  domaineMentor: string | null;

  @Column({ name: 'experience_mentor', type: 'int', nullable: true })
  experienceMentor: number | null;

  @Column({ name: 'bio_mentor', type: 'text', nullable: true })
  bioMentor: string | null;

  @Column({ type: 'enum', enum: DisponibiliteEnum, nullable: true })
  disponibilite: DisponibiliteEnum | null;

  @Column({ name: 'agrement_mentor', type: 'varchar', length: 100, nullable: true })
  agrementMentor: string | null;

  @Column({ name: 'note_moyenne', type: 'decimal', precision: 3, scale: 2, default: 0 })
  noteMoyenne: number;

  @Column({ name: 'nb_evaluations', type: 'int', default: 0 })
  nbEvaluations: number;

  @Column({ name: 'langues_mentor', type: 'jsonb', default: () => "'[]'::jsonb" })
  languesMentor: string[];

  // Préférences
  @Column({ type: 'enum', enum: LangueEnum, default: LangueEnum.FR })
  langue: LangueEnum;

  @Column({ type: 'enum', enum: ThemeEnum, default: ThemeEnum.LIGHT })
  theme: ThemeEnum;

  @Column({ name: 'notif_email', type: 'boolean', default: true })
  notifEmail: boolean;

  @Column({ name: 'notif_sms', type: 'boolean', default: false })
  notifSms: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

    // ⬇️ NOUVEAU : badges obtenus (FPD, etc.)
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  badges: any[];

  // Relations
  @OneToMany(() => Entreprise, (e) => e.dirigeant)
  entreprisesDirigees: Entreprise[];

  @OneToMany(() => Entreprise, (e) => e.mentor)
  entreprisesMentorees: Entreprise[];

  @OneToMany(() => Demande, (d) => d.emetteur)
  demandesEmises: Demande[];

  @OneToMany(() => Message, (m) => m.expediteur)
  messagesEnvoyes: Message[];

  @OneToMany(() => Notification, (n) => n.utilisateur)
  notifications: Notification[];
}