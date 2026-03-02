import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      // Resolve relative to this file so it works regardless of CWD
      // (turbo root, Docker WORKDIR, or direct node invocation).
      // In Docker, vars are injected directly by Compose — the file may not
      // exist and that is fine: ignoreEnvFile has no effect when the vars
      // are already in process.env.
      envFilePath: [
        // Primary: package-level .env (local dev without Docker)
        require('path').resolve(__dirname, '..', '..', '.env'),
        // Fallback: monorepo root .env (Docker dev or running from root)
        require('path').resolve(__dirname, '..', '..', '..', '..', '.env'),
      ],
    }),

    // Database — retries gracefully while Docker starts
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
        retryAttempts: 10,
        retryDelay: 3000,
        connectTimeoutMS: 10000,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Feature modules
    AiModule,
    AuthModule,
    UsersModule,
    WebhooksModule,
    ChecklistsModule,
  ],
})
export class AppModule {}
