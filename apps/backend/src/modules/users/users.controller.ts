import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Request, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { UserEntity } from './user.entity';

class ToggleActiveDto { isActive!: boolean; }
class UpdateProfileDto { name?: string; telegramChatId?: string; }

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /v1/users/me — current user's profile */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: { user: { sub: string } }): Promise<UserEntity> {
    return this.usersService.findOne(req.user.sub);
  }

  /** PATCH /v1/users/me — update name or telegramChatId */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own profile (name, telegramChatId)' })
  updateMe(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  /** Admin-only routes */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get all users (admin)' })
  findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate or deactivate a user (superadmin)' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleActiveDto,
  ): Promise<UserEntity> {
    return this.usersService.setActive(id, dto.isActive);
  }
}
