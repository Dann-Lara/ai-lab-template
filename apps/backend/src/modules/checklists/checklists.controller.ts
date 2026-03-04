import {
  Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus,
  Param, Patch, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrWebhookSecretGuard } from '../auth/guards/jwt-or-webhook.guard';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistParamsDto, ConfirmChecklistDto, RegenerateDraftDto,
  PatchItemDto, PatchChecklistDto,
} from './dto/checklist.dto';

@ApiTags('Checklists')
@ApiBearerAuth()
@Controller({ path: 'checklists', version: '1' })
export class ChecklistsController {
  constructor(
    private readonly svc: ChecklistsService,
    private readonly configService: ConfigService,
  ) {}

  // ── AI generation ──────────────────────────────────────────────────────────
  @Post('generate-draft')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI draft tasks from questionnaire params' })
  @UseGuards(JwtAuthGuard)
  generateDraft(@CurrentUser() user: JwtUser, @Body() dto: CreateChecklistParamsDto) {
    return this.svc.generateDraft(user.userId, dto);
  }

  @Post('regenerate-draft')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Regenerate draft with user feedback' })
  @UseGuards(JwtAuthGuard)
  regenerateDraft(@CurrentUser() user: JwtUser, @Body() dto: RegenerateDraftDto) {
    return this.svc.regenerateDraft(user.userId, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Save confirmed checklist to DB' })
  @UseGuards(JwtAuthGuard)
  confirm(@CurrentUser() user: JwtUser, @Body() dto: ConfirmChecklistDto) {
    return this.svc.confirm(user.userId, dto);
  }

  // ── n8n internal (webhook secret — no JWT required) ───────────────────────

  /**
   * Returns ONE next pending item per active checklist with telegramChatId.
   * Item N is only returned once items 0..N-1 are all completed or skipped.
   */
  @Get('reminders/due')
  @ApiOperation({ summary: 'Next ordered reminder per checklist — for n8n' })
  getDueReminders(@Headers('x-webhook-secret') secret: string) {
    this.assertWebhookSecret(secret);
    return this.svc.getDueReminders();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List user checklists' })
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: JwtUser) {
    return this.svc.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checklist detail with items' })
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update checklist status/title' })
  @UseGuards(JwtOrWebhookSecretGuard)
  patchChecklist(
    @Req() req: { user?: JwtUser; webhookAuth?: boolean },
    @Param('id') id: string,
    @Body() dto: PatchChecklistDto,
  ) {
    if (req.webhookAuth) return this.svc.patchChecklistById(id, dto);
    return this.svc.patchChecklist(req.user!.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist' })
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.remove(user.userId, id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Progress data for dashboard charts' })
  @UseGuards(JwtAuthGuard)
  getProgress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.getProgress(user.userId, id);
  }

  /**
   * JWT (from UI) OR webhook-secret (n8n weekly workflow — no JWT).
   */
  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI weekly feedback (JWT or n8n)' })
  @UseGuards(JwtOrWebhookSecretGuard)
  generateFeedback(
    @Req() req: { user?: JwtUser; webhookAuth?: boolean },
    @Param('id') id: string,
  ) {
    if (req.webhookAuth) return this.svc.generateFeedbackById(id);
    return this.svc.generateFeedback(req.user!.userId, id);
  }

  /**
   * PATCH /v1/checklists/:id/items/:itemId
   * JWT  → complete | postpone | skip   (from web UI)
   * webhook-secret → mark-reminded      (n8n after Telegram send)
   *                  complete | postpone (n8n Telegram button)
   */
  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'complete / postpone / skip / mark-reminded' })
  @UseGuards(JwtOrWebhookSecretGuard)
  patchItem(
    @Req() req: { user?: JwtUser; webhookAuth?: boolean },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: PatchItemDto,
  ) {
    if (req.webhookAuth) {
      return this.svc.patchItemByIdOnly(
        itemId,
        dto.action as 'complete' | 'postpone' | 'skip' | 'mark-reminded',
      );
    }
    return this.svc.patchItem(req.user!.userId, id, itemId, dto);
  }

  /**
   * POST /v1/checklists/:id/send-to-telegram
   * Sends full checklist as one Telegram message. Triggered from UI button.
   */
  @Post(':id/send-to-telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send full checklist to Telegram (one message)' })
  @UseGuards(JwtAuthGuard)
  sendToTelegram(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.sendChecklistToTelegram(user.userId, id);
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private assertWebhookSecret(secret: string): void {
    const expected = this.configService.get<string>('N8N_WEBHOOK_SECRET', '');
    if (!secret || secret !== expected) throw new UnauthorizedException('Invalid webhook secret');
  }
}
