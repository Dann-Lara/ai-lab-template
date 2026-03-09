import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Request, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import type { PermissionsMap } from './user.entity';

class ToggleActiveDto { isActive!: boolean; }
class UpdateProfileDto { name?: string; telegramChatId?: string; }

class SetPermissionDto {
  @IsString() key!: string;
  @IsBoolean() value!: boolean;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Own profile ────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: { user: { sub: string } }) {
    return this.usersService.findOne(req.user.sub);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own profile (name, telegramChatId)' })
  updateMe(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  /**
   * GET /v1/users/me/permissions
   * Returns the effective permissions for the current user.
   * Superadmin/admin always get all modules = true.
   * Clients get their stored permissions (merged with defaults).
   * This is the endpoint the frontend calls on every page load.
   */
  @Get('me/permissions')
  @ApiOperation({ summary: 'Get effective module permissions for the current user' })
  async getMyPermissions(@CurrentUser() user: JwtUser): Promise<PermissionsMap> {
    const full = await this.usersService.findOne(user.userId);
    const result = this.usersService.getEffectivePermissions(full);
    console.log(`[UsersController] GET me/permissions userId=${user.userId} role=${user.role} result=${JSON.stringify(result)}`);
    return result;
  }

  // ── Admin — user management ────────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'List all users (admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get user by ID with their permissions (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate user (superadmin)' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleActiveDto,
  ) {
    return this.usersService.setActive(id, dto.isActive);
  }

  /**
   * PATCH /v1/users/:id/permissions
   * Set a single module permission for a user.
   * Body: { key: "applications", value: false }
   * Only superadmin can change permissions.
   */
  @Patch(':id/permissions')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a module permission for a user (superadmin)' })
  setPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPermissionDto,
  ): Promise<PermissionsMap> {
    return this.usersService.setPermission(id, dto.key, dto.value);
  }
}
