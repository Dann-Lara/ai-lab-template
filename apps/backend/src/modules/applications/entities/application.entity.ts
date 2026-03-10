import {
  Column, CreateDateColumn, Entity, Index,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity';

export type ApplicationStatus = 'pending' | 'in_process' | 'accepted' | 'rejected';

// ── Base CV — one per user, stored in DB ─────────────────────────────────────
@Entity('base_cvs')
@Index(['userId'], { unique: true })
export class BaseCvEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ length: 150, default: '' }) fullName!: string;
  @Column({ length: 150, default: '' }) email!: string;
  @Column({ length: 50, default: '' }) phone!: string;
  @Column({ length: 150, default: '' }) location!: string;
  @Column({ length: 250, default: '' }) linkedIn!: string;
  @Column({ type: 'text', default: '' }) summary!: string;
  @Column({ type: 'text', default: '' }) experience!: string;
  @Column({ type: 'text', default: '' }) education!: string;
  @Column({ type: 'text', default: '' }) skills!: string;
  @Column({ length: 250, default: '' }) languages!: string;
  @Column({ type: 'text', default: '' }) certifications!: string;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

// ── Application ───────────────────────────────────────────────────────────────
@Entity('applications')
@Index(['userId', 'status'])
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ length: 200 }) company!: string;
  @Column({ length: 200 }) position!: string;
  @Column({ type: 'text' }) jobOffer!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: ApplicationStatus;

  @Column({ type: 'int', nullable: true }) atsScore?: number;
  /** Original single-language generated CV (kept for backwards compat) */
  @Column({ type: 'text', nullable: true }) cvGenerated?: string;
  /** ATS-optimized CV in Spanish */
  @Column({ type: 'text', nullable: true }) cvGeneratedEs?: string;
  /** ATS-optimized CV in English */
  @Column({ type: 'text', nullable: true }) cvGeneratedEn?: string;
  @Column({ default: false }) cvGeneratedFlag!: boolean;

  /** Where the user applied from (e.g. linkedin, indeed, company website) */
  @Column({ length: 200, nullable: true }) appliedFrom?: string;
  /** Raw textarea of interview questions pasted by the user */
  @Column({ type: 'text', nullable: true }) interviewQuestions?: string;
  /** AI-generated answers to the interview questions */
  @Column({ type: 'text', nullable: true }) interviewAnswers?: string;

  @CreateDateColumn() appliedAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
