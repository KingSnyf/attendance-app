import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, ForbiddenException, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../auth/user.decorator';
import { StrictRateLimiterGuard } from '../auth/strict-rate-limiter.guard';
import { Request, Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/api',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(StrictRateLimiterGuard)
  @Post('login')
  login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(payload.email, payload.password).then((result) => {
      res.cookie('refresh_token', result.refresh_token, COOKIE_OPTIONS);
      return { access_token: result.access_token, user: result.user };
    });
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) throw new ForbiddenException('Refresh token manquant');
    const result = await this.authService.refreshToken(token);
    return { access_token: result.access_token };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api' });
    return { success: true };
  }

  @Public()
  @UseGuards(StrictRateLimiterGuard)
  @Post('register')
  register(@Body() payload: CreateUserDto) {
    return this.authService.register(payload);
  }

  @Get('users')
  @Roles('gestionnaire', 'admin')
  async list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.authService.list(Number(skip) || 0, Number(take) || 1000);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string, @User() user: any) {
    if (user.role === 'employe' && user.userId !== id) {
      throw new ForbiddenException('Vous ne pouvez consulter que votre propre profil');
    }
    return this.authService.getUser(id);
  }

  @Get('me')
  async me(@User() user: any) {
    return this.authService.getUser(user.userId);
  }

  @Patch('profile')
  async updateProfile(@Body() body: UpdateProfileDto, @User() user: any) {
    return this.authService.updateProfile(user.userId, body);
  }

  @UseGuards(StrictRateLimiterGuard)
  @Patch('password')
  async changePassword(@Body() body: ChangePasswordDto, @User() user: any) {
    return this.authService.changePassword(user.userId, body.currentPassword, body.newPassword);
  }

  @Public()
  @UseGuards(StrictRateLimiterGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new ForbiddenException('Le mot de passe doit contenir au moins 6 caractères');
    }
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
