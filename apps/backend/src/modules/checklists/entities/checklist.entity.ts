import {
  Column, CreateDateColumn, Entity, ManyToOne,
  OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from '../../users/user.entity';

export type Difficulty = 'low' | 'medium' | 'high';
export type TaskStyle = 'micro-habits' | 'concrete-tasks' | 'mixed';
export type ChecklistStatus = 'active' | 'paused' | 'completed';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';
export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'custom';
export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface ReminderPreferences {
  time: string;        // "HH:MM"
  days: string[];      // ["monday","wednesday","friday"]
  frequency: 'daily' | 'weekly' | 'custom';
}

@Entity('checklists')
@Index(['userId', 'status'])
export class ChecklistEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ length: 100 }) title!: string;
  @Column({ type: 'text' }) objective!: string;
  @Column({ length: 50, nullable: true }) category?: string;
  @Column({ type: 'date' }) startDate!: string;
  @Column({ type: 'date' }) endDate!: string;
  @Column({ type: 'varchar', default: 'medium' }) difficulty!: Difficulty;
  @Column({ type: 'int' }) dailyTimeAvailable!: number;

  @Column({ type: 'jsonb', nullable: true })
  reminderPreferences?: ReminderPreferences;

  @Column({ default: false }) isRecurring!: boolean;

  @Column({ type: 'varchar', nullable: true })
  recurrencePattern?: RecurrencePattern;

  @Column({ length: 200, nullable: true }) goalMetric?: string;
  @Column({ type: 'varchar', default: 'mixed' }) style!: TaskStyle;

  @Column({ type: 'varchar', default: 'active' })
  @Index()
  status!: ChecklistStatus;

  @Column({ length: 50, nullable: true }) telegramChatId?: string;
  @Column({ length: 5, default: 'es' }) language!: string;

  @OneToMany(() => ChecklistItemEntity, (item) => item.checklist, { cascade: true })
  items!: ChecklistItemEntity[];

  @OneToMany(() => ChecklistFeedbackEntity, (f) => f.checklist, { cascade: true })
  feedbacks!: ChecklistFeedbackEntity[];

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity('checklist_items')
@Index(['checklistId', 'status'])
@Index(['dueDate'])
export class ChecklistItemEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'checklist_id' })
  checklistId!: string;

  @ManyToOne(() => ChecklistEntity, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist!: ChecklistEntity;

  @Column({ type: 'int', default: 0 }) order!: number;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'varchar', default: 'daily' }) frequency!: TaskFrequency;
  @Column({ type: 'int', nullable: true }) customFrequencyDays?: number;
  @Column({ type: 'int', default: 15 }) estimatedDuration!: number;
  @Column({ length: 200 }) hack!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: TaskStatus;

  @Column({ type: 'timestamp', nullable: true }) completedAt?: Date;
  @Column({ type: 'timestamp', nullable: true }) dueDate?: Date;
  @Column({ default: false }) reminderSent!: boolean;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity('checklist_feedbacks')
export class ChecklistFeedbackEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ name: 'checklist_id' })
  checklistId!: string;

  @ManyToOne(() => ChecklistEntity, (c) => c.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist!: ChecklistEntity;

  @Column({ type: 'text' }) feedbackText!: string;
  @Column({ type: 'timestamp', default: () => 'NOW()' }) generatedAt!: Date;
  @Column({ type: 'int', nullable: true }) weekNumber?: number;
}
