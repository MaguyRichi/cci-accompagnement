import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ModuleFPD } from './module-fpd.entity';

@Entity('fpd_quizzes')
export class QuizFPD {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'module_id', type: 'int' })
  moduleId: number;

  @ManyToOne(() => ModuleFPD, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: ModuleFPD;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column({ name: 'bonne_reponse', type: 'int' })
  bonneReponse: number;

  @Column({ type: 'int', default: 1 })
  ordre: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}