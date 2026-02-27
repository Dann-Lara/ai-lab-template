import 'reflect-metadata';
import { AppDataSource } from '../apps/backend/src/database/data-source';
import { UserEntity } from '../apps/backend/src/modules/users/user.entity';
import * as bcrypt from 'bcrypt';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('🌱 Seeding database...');

  const userRepo = AppDataSource.getRepository(UserEntity);

  const adminExists = await userRepo.findOneBy({ email: 'admin@ailab.dev' });
  if (!adminExists) {
    await userRepo.save(
      userRepo.create({
        email: 'admin@ailab.dev',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('Admin123!', 12),
        role: 'admin',
      }),
    );
    console.log('✅ Admin user created: admin@ailab.dev / Admin123!');
  }

  const testExists = await userRepo.findOneBy({ email: 'user@ailab.dev' });
  if (!testExists) {
    await userRepo.save(
      userRepo.create({
        email: 'user@ailab.dev',
        name: 'Test User',
        passwordHash: await bcrypt.hash('User123!', 12),
        role: 'user',
      }),
    );
    console.log('✅ Test user created: user@ailab.dev / User123!');
  }

  await AppDataSource.destroy();
  console.log('✅ Seed complete!');
}

void seed().catch(console.error);
