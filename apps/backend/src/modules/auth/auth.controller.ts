import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService, type AuthTokens } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, type JwtUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

class RefreshDto { token!: string; }

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // Public: anyone can sign up as a CLIENT
  @Post('signup')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Public signup — creates a client account' })
  async signup(@Body() dto: CreateUserDto): Promise<{ message: string }> {
    await this.usersService.create({ ...dto, role: 'client' });
    return { message: 'Account created successfully' };
  }

  // Public: login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login — returns access + refresh tokens' })
  login(@Request() req: { user: any }): AuthTokens {
    return this.authService.login(req.user as any);
  }

  // Refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() body: RefreshDto): Promise<AuthTokens> {
    return this.authService.refreshToken(body.token);
  }

  // Get current user info (any authenticated user)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: JwtUser): JwtUser {
    return user;
  }

  // Admin creates users (admin or client roles)
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Superadmin creates a user with specified role' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() creator: JwtUser,
  ): Promise<{ message: string }> {
    await this.usersService.create(dto, creator.role);
    return { message: 'User created successfully' };
  }
}
