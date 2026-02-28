import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Security
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

  // Swagger
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Lab API')
      .setDescription('Fullstack AI Lab Template API — Auth, AI, Webhooks')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // Ensure superadmin exists
  const usersService = app.get(UsersService);
  await usersService.ensureSuperAdmin();

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  console.warn(`🚀 Backend: http://localhost:${port}`);
  console.warn(`📚 Swagger: http://localhost:${port}/api/docs`);
  console.warn(`🔑 Superadmin: ${process.env['SUPERADMIN_EMAIL'] ?? 'superadmin@ailab.dev'}`);
}

void bootstrap();
