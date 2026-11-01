import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { InscriptionFPD } from './inscription-fpd.entity';
import { QuizFPD } from './quiz-fpd.entity';

@Entity('fpd_resultats')
@Unique(['inscriptionId', 'quizId'])
export class ResultatFPD {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'inscription_id', type: 'int' })
  inscriptionId: number;

  @ManyToOne(() => InscriptionFPD, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inscription_id' })
  inscription: InscriptionFPD;

  @Column({ name: 'quiz_id', type: 'int' })
  quizId: number;

  @ManyToOne(() => QuizFPD, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: QuizFPD;

  @Column({ type: 'int', default: 0 })
  score: number;

  @CreateDateColumn({ name: 'date_passage' })
  datePassage: Date;
}