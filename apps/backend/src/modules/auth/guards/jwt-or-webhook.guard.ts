import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

/** Allows request if either JWT is valid OR x-webhook-secret matches N8N_WEBHOOK_SECRET. */
@Injectable()
export class JwtOrWebhookSecretGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers?.['x-webhook-secret'];
    const expected = this.config.get<string>('N8N_WEBHOOK_SECRET', '');
    if (secret && expected && secret === expected) {
      (request as { webhookAuth?: boolean }).webhookAuth = true;
      return true;
    }
    return this.jwtGuard.canActivate(context) as Promise<boolean>;
  }
}