import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';

// ─────────────────────────────────────────────────────────────────────────────
// .env loading strategy
//
//  LOCAL DEV (npm run dev via Turborepo):
//    Turbo sets CWD to the package dir → apps/backend/
//    → loads apps/backend/.env          (has DATABASE_URL, REDIS_URL, etc.)
//
//  DOCKER (docker compose up):
//    All vars are injected directly into process.env by Docker Compose
//    → no .env file needed; ConfigModule finds nothing but process.env is full
//
//  The envFilePath array tries both locations; first file found wins per key.
//  DO NOT use path.resolve(__dirname, …) here — __dirname changes between
//  ts-node (src/) and compiled dist/ and makes the path unpredictable.
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // CWD when turbo runs dev = apps/backend/ → '.env' = apps/backend/.env ✓
      // If that doesn't exist (e.g. running from project root directly),
      // try the monorepo root .env as fallback.
      envFilePath: ['.env', '../../.env'],
      // Never throw when a file is missing — Docker injects vars without files.
      ignoreEnvFile: false,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: getDatabaseUrl(config),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
        retryAttempts: 10,
        retryDelay: 3000,
        connectTimeoutMS: 10000,
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl:   config.get<number>('THROTTLE_TTL',   60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    AiModule,
    AuthModule,
    UsersModule,
    WebhooksModule,
    ChecklistsModule,
  ],
})
export class AppModule {}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — kept out of the class so they're testable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a valid PostgreSQL connection URL regardless of which .env was loaded.
 *
 * apps/backend/.env  → sets DATABASE_URL directly             (local dev)
 * root .env          → sets DB_USER / DB_PASSWORD / DB_NAME   (Docker / fallback)
 * process.env        → Docker Compose injects everything       (containers)
 */
function getDatabaseUrl(config: ConfigService): string {
  const url = config.get<string>('DATABASE_URL');
  if (url) return url;

  const user = config.get<string>('DB_USER')     ?? 'admin';
  const pass = config.get<string>('DB_PASSWORD') ?? 'secret';
  const host = config.get<string>('DB_HOST')     ?? 'localhost';
  const port = config.get<string>('DB_PORT')     ?? '5432';
  const name = config.get<string>('DB_NAME')     ?? 'ailab';

  return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}
