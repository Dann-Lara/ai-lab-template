import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({
      select: ['id', 'email', 'name', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'role', 'passwordHash', 'isActive'],
    });
  }
}
