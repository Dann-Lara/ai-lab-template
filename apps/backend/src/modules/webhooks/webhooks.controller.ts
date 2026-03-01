import {
  Body, Controller, Headers, HttpCode, HttpStatus,
  Logger, Post, UnauthorizedException, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class TelegramCallbackDto {
  update_id!: number;
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message: { message_id: number; chat: { id: number } };
    data: string; // "complete:itemId" | "postpone:itemId"
  };
  message?: {
    message_id: number;
    from: { id: number };
    chat: { id: number };
    text: string;
  };
}

@ApiTags('Webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly checklistsService: ChecklistsService,
  ) {}

  /** Receive events FROM n8n (internal) */
  @Post('n8n')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from n8n' })
  receiveN8nEvent(
    @Headers('x-webhook-secret') secret: string,
    @Body() payload: Record<string, unknown>,
  ): { received: boolean } {
    if (!this.webhooksService.validateWebhookSecret(secret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    this.logger.log('Received n8n webhook event', payload);
    void this.processN8nEvent(payload);
    return { received: true };
  }

  /** Telegram callback buttons (complete / postpone) — called by n8n */
  @Post('telegram-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Telegram inline button callback from n8n' })
  async handleTelegramResponse(
    @Headers('x-webhook-secret') secret: string,
    @Body() body: TelegramCallbackDto,
  ): Promise<{ ok: boolean; message?: string }> {
    if (!this.webhooksService.validateWebhookSecret(secret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    // Parse callback_query.data = "complete:itemId" | "postpone:itemId"
    const data = body.callback_query?.data ?? body.message?.text ?? '';
    const [action, itemId] = data.split(':');

    if (!itemId || !['complete', 'postpone', 'skip'].includes(action)) {
      return { ok: false, message: 'Unknown action or missing itemId' };
    }

    try {
      await this.checklistsService.patchItemByIdOnly(
        itemId,
        action as 'complete' | 'postpone' | 'skip',
      );
      this.logger.log(`Telegram action '${action}' applied to item ${itemId}`);
      return { ok: true, message: action === 'complete' ? '✅ Tarea completada' : '⏳ Tarea aplazada' };
    } catch (e) {
      this.logger.warn(`Failed to apply Telegram action: ${String(e)}`);
      return { ok: false, message: String(e) };
    }
  }

  private async processN8nEvent(payload: Record<string, unknown>): Promise<void> {
    const eventType = payload['type'] as string;
    this.logger.log(`Processing n8n event: ${eventType}`);
  }
}
