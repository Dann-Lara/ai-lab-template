import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async triggerN8nWorkflow(
    webhookPath: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const n8nBaseUrl = this.configService.get<string>('N8N_BASE_URL', 'http://localhost:5678');
    const secret = this.configService.get<string>('N8N_WEBHOOK_SECRET', '');

    try {
      await firstValueFrom(
        this.httpService.post(`${n8nBaseUrl}/webhook/${webhookPath}`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': secret,
          },
          timeout: 10000,
        }),
      );
      this.logger.log(`n8n webhook triggered: ${webhookPath}`);
    } catch (error) {
      this.logger.warn(`Failed to trigger n8n webhook: ${webhookPath} — ${String(error)}`);
    }
  }

  validateWebhookSecret(secret: string): boolean {
    const expected = this.configService.get<string>('N8N_WEBHOOK_SECRET', '');
    return secret === expected;
  }
}
