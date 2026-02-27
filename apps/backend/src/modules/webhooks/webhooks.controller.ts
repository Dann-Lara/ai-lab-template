import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Receive events FROM n8n
   */
  @Post('n8n')
  @ApiOperation({ summary: 'Receive webhook from n8n' })
  receiveN8nEvent(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: Record<string, unknown>,
  ): { received: boolean } {
    if (!this.webhooksService.validateWebhookSecret(secret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    this.logger.log('Received n8n webhook event', payload);
    // Handle the event asynchronously
    void this.processN8nEvent(payload);

    return { received: true };
  }

  private async processN8nEvent(payload: Record<string, unknown>): Promise<void> {
    const eventType = payload['type'] as string;
    this.logger.log(`Processing n8n event: ${eventType}`);
    // Add event processing logic here
  }
}
