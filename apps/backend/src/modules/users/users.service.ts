import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import {
  UserEntity,
  DEFAULT_PERMISSIONS,
  MODULE_KEYS,
  type PermissionsMap,
} from './user.entity';
import type { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────
  async create(dto: CreateUserDto, creatorRole?: string): Promise<UserEntity> {
    const existing = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already in use');

    const role = dto.role ?? 'client';
    if (creatorRole && creatorRole !== 'superadmin' && role !== 'client') {
      throw new ForbiddenException('You can only create client accounts');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      role,
      permissions: { ...DEFAULT_PERMISSIONS },
    });
    return this.userRepo.save(user);
  }

  // ── List ───────────────────────────────────────────────────────────────────
  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'permissions', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Find one — always includes permissions ─────────────────────────────────
  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'permissions', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    // Ensure permissions is always a complete map (fill missing keys with defaults)
    user.permissions = this.resolvePermissions(user);
    return user;
  }

  // ── Get effective permissions for a user ──────────────────────────────────
  getEffectivePermissions(user: UserEntity): PermissionsMap {
    // Privileged roles always get full access — never read the DB column
    if (user.role === 'superadmin' || user.role === 'admin') {
      return Object.fromEntries(MODULE_KEYS.map(k => [k, true])) as PermissionsMap;
    }
    return this.resolvePermissions(user);
  }

  private resolvePermissions(user: UserEntity): PermissionsMap {
    // Merge stored partial permissions over the defaults
    // → new module keys automatically get their default value
    return { ...DEFAULT_PERMISSIONS, ...(user.permissions ?? {}) } as PermissionsMap;
  }

  // ── Update a single permission (superadmin only) ───────────────────────────
  async setPermission(
    targetUserId: string,
    key: string,
    value: boolean,
  ): Promise<PermissionsMap> {
    const user = await this.findOne(targetUserId);
    const current = this.resolvePermissions(user);

    if (!(MODULE_KEYS as readonly string[]).includes(key)) {
      throw new ForbiddenException(`Unknown permission key: ${key}`);
    }

    const updated = { ...current, [key]: value };
    await this.userRepo.update(targetUserId, { permissions: updated });
    return updated;
  }

  // ── Bulk replace permissions ───────────────────────────────────────────────
  async setAllPermissions(
    targetUserId: string,
    permissions: Partial<PermissionsMap>,
  ): Promise<PermissionsMap> {
    await this.findOne(targetUserId); // ensures user exists
    const merged = { ...DEFAULT_PERMISSIONS, ...permissions } as PermissionsMap;
    await this.userRepo.update(targetUserId, { permissions: merged });
    return merged;
  }

  // ── Find by email ──────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'name', 'role', 'passwordHash', 'isActive', 'permissions'],
    });
  }

  // ── Profile update ─────────────────────────────────────────────────────────
  async updateProfile(id: string, dto: { name?: string; telegramChatId?: string }): Promise<UserEntity> {
    await this.userRepo.update(id, dto);
    return this.findOne(id);
  }

  // ── Active toggle ──────────────────────────────────────────────────────────
  async setActive(id: string, isActive: boolean): Promise<UserEntity> {
    await this.userRepo.update(id, { isActive });
    return this.findOne(id);
  }

  // ── Telegram list ──────────────────────────────────────────────────────────
  async findAllWithTelegram(): Promise<UserEntity[]> {
    return this.userRepo.find({
      where: { role: 'superadmin' },
      select: ['id', 'email', 'name', 'role', 'telegramChatId'],
    });
  }

  // ── Seed superadmin ────────────────────────────────────────────────────────
  async ensureSuperAdmin(): Promise<void> {
    const existing = await this.userRepo.findOneBy({ role: 'superadmin' });
    if (existing) return;

    const passwordHash = await bcrypt.hash(process.env['SUPERADMIN_PASSWORD'] ?? 'SuperAdmin123!', 12);
    await this.userRepo.save(
      this.userRepo.create({
        email: (process.env['SUPERADMIN_EMAIL'] ?? 'superadmin@ailab.dev').toLowerCase(),
        name: 'Super Admin',
        passwordHash,
        role: 'superadmin',
        permissions: Object.fromEntries(MODULE_KEYS.map(k => [k, true])) as PermissionsMap,
      }),
    );
  }
}
