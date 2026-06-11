import { Body, Controller, Get, Post, Query, Redirect, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
    name: string;
    tokenId?: string;
    refreshToken?: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() req: AuthRequest) {
    return req.user;
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: AuthRequest, @Body() _dto: RefreshDto) {
    return this.authService.refresh(
      req.user.userId,
      req.user.tokenId!,
      req.user.refreshToken!,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout(@Req() req: AuthRequest, @Body() body: { refreshTokenId?: string }) {
    return this.authService.logout(req.user.userId, body?.refreshTokenId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changePassword(@Req() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @Get('google')
  @Redirect()
  googleLogin() {
    const url = this.authService.getGoogleAuthUrl();
    return { url };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      return res.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/login?error=google_denied`,
      );
    }
    try {
      const tokens = await this.authService.loginWithGoogle(code);
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      return res.redirect(
        `${frontendUrl}/auth/google-success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    } catch (err: any) {
      return res.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/login?error=google_failed`,
      );
    }
  }
}
