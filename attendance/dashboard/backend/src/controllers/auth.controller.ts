import { Body, Controller, Get, Param, Post, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
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
}
