import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SessionFPD } from './session-fpd.entity';
import { QuizFPD } from './quiz-fpd.entity';

@Entity('fpd_modules')
export class ModuleFPD {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @ManyToOne(() => SessionFPD, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: SessionFPD;

  @Column({ type: 'varchar', length: 200 })
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => QuizFPD, (q) => q.module)
  quizzes: QuizFPD[];
}