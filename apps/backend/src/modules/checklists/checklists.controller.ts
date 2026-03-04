import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrWebhookSecretGuard } from '../auth/guards/jwt-or-webhook.guard';

import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistParamsDto,
  ConfirmChecklistDto,
  RegenerateDraftDto,
  PatchItemDto,
  PatchChecklistDto,
} from './dto/checklist.dto';

@ApiTags('Checklists')
@ApiBearerAuth()
@Controller({ path: 'checklists', version: '1' })
export class ChecklistsController {
  constructor(
    private readonly svc: ChecklistsService,
    private readonly configService: ConfigService,
  ) {}

  // ── AI generation (rate-limited: 10/min per endpoint) ─────────────────────
  @Post('generate-draft')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI draft tasks from questionnaire params' })
  @UseGuards(JwtAuthGuard)
  generateDraft(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateChecklistParamsDto,
  ) {
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

  // ── n8n reminder endpoint (uses API key from header, not JWT) ─────────────
  @Get('reminders/due')
  @ApiOperation({ summary: 'Due reminders for n8n (internal)' })
  getDueReminders(
    @Headers('x-webhook-secret') secret: string,
  ) {
    const expected = this.configService.get<string>('N8N_WEBHOOK_SECRET', '');
    if (!secret || secret !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
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
    if (req.webhookAuth) {
      return this.svc.patchChecklistById(id, dto);
    }
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

  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI weekly feedback' })
  @UseGuards(JwtAuthGuard)
  generateFeedback(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.generateFeedback(user.userId, id);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Complete / postpone / skip a task' })
  @UseGuards(JwtAuthGuard)
  patchItem(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: PatchItemDto,
  ) {
    return this.svc.patchItem(user.userId, id, itemId, dto);
  }
}