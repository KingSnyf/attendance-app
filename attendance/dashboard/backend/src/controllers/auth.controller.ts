import { Body, Controller, Get, Param, Patch, Post, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../auth/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload.email, payload.password);
  }

  @Public()
  @Post('register')
  register(@Body() payload: CreateUserDto) {
    return this.authService.register(payload);
  }

  @Get('users')
  @Roles('gestionnaire', 'admin')
  async list() {
    return this.authService.list();
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

  @Patch('password')
  async changePassword(@Body() body: ChangePasswordDto, @User() user: any) {
    return this.authService.changePassword(user.userId, body.currentPassword, body.newPassword);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }
}
