import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'superadmin' | 'admin' | 'client';

/**
 * Module permission keys.
 * Add a new key here when a new module is created.
 * The value is the default — true = enabled for all, false = disabled by default.
 *
 * Superadmin and admin always have access to every module regardless of this map.
 */
export const MODULE_KEYS = ['checklist', 'applications'] as const;
export type ModuleKey = typeof MODULE_KEYS[number];
export type PermissionsMap = Record<ModuleKey, boolean>;

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  checklist:    true,
  applications: true,
};

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', default: 'client' })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true, type: 'varchar' })
  telegramChatId?: string;

  /**
   * Module-level permissions.  Stored as JSONB.
   * Null / missing = use DEFAULT_PERMISSIONS (all enabled).
   * Superadmin and admin always bypass this field entirely.
   */
  @Column({ type: 'jsonb', nullable: true })
  permissions?: Partial<PermissionsMap> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
