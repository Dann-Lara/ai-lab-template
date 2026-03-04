import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

// ─────────────────────────────────────────────────────────────────────────────
// Startup env validation — catch missing/wrong vars BEFORE the cryptic
// pg "password must be a string" or "invalid API key" errors appear.
// ─────────────────────────────────────────────────────────────────────────────
function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Database — need either the full URL or the individual parts
  const hasDbUrl   = !!process.env['DATABASE_URL'];
  const hasDbParts = !!(process.env['DB_USER'] && process.env['DB_PASSWORD'] && process.env['DB_NAME']);
  if (!hasDbUrl && !hasDbParts) {
    missing.push('DATABASE_URL  (or DB_USER + DB_PASSWORD + DB_NAME)');
  }

  // Auth
  if (!process.env['JWT_SECRET']) {
    missing.push('JWT_SECRET');
  } else if (process.env['JWT_SECRET'] === 'dev-jwt-secret-change-in-production-min-32-chars') {
    if (process.env['NODE_ENV'] === 'production') {
      missing.push('JWT_SECRET  (still set to default dev value — change before production!)');
    }
  }

  // AI providers — need at least one
  const aiKeys = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'ANTHROPIC_API_KEY'];
  const activeAi = aiKeys.filter((k) => process.env[k]);
  if (activeAi.length === 0) {
    warnings.push(
      'No AI provider key set. AI features will not work.\n' +
      '  → Set GEMINI_API_KEY (free: https://aistudio.google.com/app/apikey)\n' +
      '  → or GROQ_API_KEY (free: https://console.groq.com)',
    );
  }

  if (missing.length > 0) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║  MISSING REQUIRED ENVIRONMENT VARIABLES                  ║');
    console.error('╚══════════════════════════════════════════════════════════╝');
    for (const v of missing) {
      console.error(`  ✗ ${v}`);
    }
    console.error('\n  → Edit apps/backend/.env  (local dev)');
    console.error('  → or .env  (Docker Compose)');
    console.error('  → Run: npm run setup  to create .env files from templates\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    for (const w of warnings) {
      console.warn(`  ${w}`);
    }
    console.warn('');
  }
}

async function bootstrap(): Promise<void> {
  // Validate before NestJS tries to use the vars (avoids cryptic pg/auth errors)
  validateEnv();

  const app = await NestFactory.create(AppModule);

  // Security
  app.use((req: any, _res: any, next: () => void) => {
    console.log('Incoming request headers:', req.headers);
    next();
  });
  app.use(helmet());
  app.enableCors({
    origin: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  // Versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger (dev + staging only)
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Lab API')
      .setDescription('Fullstack AI Lab Template API — Auth, AI, Checklists, Webhooks')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // Ensure superadmin exists on every startup
  const usersService = app.get(UsersService);
  await usersService.ensureSuperAdmin();

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);

  const env = process.env['NODE_ENV'] ?? 'development';
  const ai  = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'ANTHROPIC_API_KEY']
    .filter((k) => process.env[k])
    .map((k) => k.replace('_API_KEY', '').toLowerCase())
    .join(', ') || 'none';

  console.log(`\n🚀  Backend  : http://localhost:${port}  [${env}]`);
  console.log(`📚  Swagger  : http://localhost:${port}/api/docs`);
  console.log(`🤖  AI ready : ${ai}`);
  console.log(`🔑  Admin    : ${process.env['SUPERADMIN_EMAIL'] ?? 'superadmin@ailab.dev'}\n`);
}

void bootstrap();
