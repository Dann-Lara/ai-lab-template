import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto, EvaluateCvDto, PatchApplicationDto,
  UpsertBaseCvDto, GenerateCvDto, ExtractCvDto,
} from './dto/application.dto';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'applications', version: '1' })
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  // ── Base CV ────────────────────────────────────────────────────────────────

  @Get('base-cv')
  @ApiOperation({ summary: 'Get the current user\'s base CV' })
  getBaseCV(@CurrentUser() user: JwtUser) {
    return this.svc.getBaseCV(user.userId);
  }

  @Put('base-cv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update the current user\'s base CV' })
  upsertBaseCV(@CurrentUser() user: JwtUser, @Body() dto: UpsertBaseCvDto) {
    return this.svc.upsertBaseCV(user.userId, dto);
  }

  // ── AI endpoints ───────────────────────────────────────────────────────────

  @Post('generate-cv')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate an ATS-optimized CV using the user\'s base CV and a job offer' })
  generateCv(@CurrentUser() user: JwtUser, @Body() dto: GenerateCvDto) {
    return this.svc.generateCv(user.userId, dto);
  }

  @Post('extract-cv')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Extract structured CV data from PDF text using AI' })
  extractCv(@CurrentUser() user: JwtUser, @Body() dto: ExtractCvDto) {
    return this.svc.extractCvFromText(user.userId, dto);
  }

  @Post('base-cv/evaluate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Evaluate Base CV quality for ATS (score 0-100, approved when >= 85)' })
  evaluateBaseCV(@CurrentUser() _user: JwtUser, @Body() dto: EvaluateCvDto) {
    return this.svc.evaluateBaseCV(dto);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate AI coaching feedback based on application history' })
  generateFeedback(@CurrentUser() user: JwtUser) {
    return this.svc.generateFeedback(user.userId);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all applications for the current user' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.svc.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single application' })
  findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.findOne(user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new application' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateApplicationDto) {
    return this.svc.create(user.userId, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application status or ATS data' })
  patch(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchApplicationDto,
  ) {
    return this.svc.patch(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an application' })
  remove(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.remove(user.userId, id);
  }
}
