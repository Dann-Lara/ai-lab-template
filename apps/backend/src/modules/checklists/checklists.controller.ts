import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistParamsDto, ConfirmChecklistDto,
  RegenerateDraftDto, PatchItemDto, PatchChecklistDto,
} from './dto/checklist.dto';

@ApiTags('Checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'checklists', version: '1' })
export class ChecklistsController {
  constructor(private readonly svc: ChecklistsService) {}

  // ── AI generation (rate-limited: 10/min per endpoint) ─────────────────────
  @Post('generate-draft')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI draft tasks from questionnaire params' })
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
  regenerateDraft(@CurrentUser() user: JwtUser, @Body() dto: RegenerateDraftDto) {
    return this.svc.regenerateDraft(user.userId, dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Save confirmed checklist to DB' })
  confirm(@CurrentUser() user: JwtUser, @Body() dto: ConfirmChecklistDto) {
    return this.svc.confirm(user.userId, dto);
  }

  // ── n8n reminder endpoint (uses API key from header, not JWT) ─────────────
  @Get('reminders/due')
  @ApiOperation({ summary: 'Due reminders for n8n (internal)' })
  getDueReminders() {
    return this.svc.getDueReminders();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List user checklists' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.svc.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checklist detail with items' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update checklist status/title' })
  patchChecklist(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: PatchChecklistDto,
  ) {
    return this.svc.patchChecklist(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete checklist' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.remove(user.userId, id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Progress data for dashboard charts' })
  getProgress(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.getProgress(user.userId, id);
  }

  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI weekly feedback' })
  generateFeedback(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.generateFeedback(user.userId, id);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Complete / postpone / skip a task' })
  patchItem(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: PatchItemDto,
  ) {
    return this.svc.patchItem(user.userId, id, itemId, dto);
  }
}
