import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import type { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto, creatorRole?: string): Promise<UserEntity> {
    const existing = await this.userRepo.findOneBy({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already in use');

    const role = dto.role ?? 'client';

    // Non-superadmins cannot create admins or superadmins
    if (creatorRole && creatorRole !== 'superadmin') {
      if (role !== 'client') {
        throw new ForbiddenException('You can only create client accounts');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      role,
    });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'name', 'role', 'passwordHash', 'isActive'],
    });
  }

  async updateProfile(id: string, dto: { name?: string; telegramChatId?: string }): Promise<UserEntity> {
    await this.userRepo.update(id, dto);
    return this.findOne(id);
  }

  async findAllWithTelegram(): Promise<UserEntity[]> {
    return this.userRepo.find({
      where: { role: 'superadmin' },
      select: ['id', 'email', 'name', 'role', 'telegramChatId'],
    });
  }

  async setActive(id: string, isActive: boolean): Promise<UserEntity> {
    const user = await this.findOne(id);
    await this.userRepo.update(id, { isActive });
    return { ...user, isActive };
  }

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
      }),
    );
  }
}
