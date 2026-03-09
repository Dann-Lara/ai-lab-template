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
  @Column({ type: 'text', nullable: true }) cvGenerated?: string;
  @Column({ default: false }) cvGeneratedFlag!: boolean;

  @CreateDateColumn() appliedAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
