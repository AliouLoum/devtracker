import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password,
      name: dto.name,
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }

  async refresh(
    userId: string,
    tokenId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const stored = await this.refreshTokenRepository.findOne({
      where: { id: tokenId, userId },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hash = this.hashToken(refreshToken);
    if (stored.tokenHash !== hash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.refreshTokenRepository.delete({ id: tokenId });
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string, tokenId?: string): Promise<void> {
    if (tokenId) {
      await this.refreshTokenRepository.delete({ id: tokenId, userId });
      return;
    }
    await this.refreshTokenRepository.delete({ userId });
  }

  async loginWithGoogle(code: string): Promise<AuthTokens> {
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.getOrThrow<string>('GOOGLE_REDIRECT_URI');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.id || !profile.email) {
      throw new UnauthorizedException('Google profile incomplete');
    }

    const user = await this.usersService.findOrCreateByGoogle({
      googleId: profile.id,
      email: profile.email,
      name: profile.name ?? profile.email.split('@')[0],
    });

    return this.issueTokens(user.id, user.email);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.password) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) {
        throw new UnauthorizedException('Invalid current password');
      }
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, newPasswordHash);
  }

  getGoogleAuthUrl(): string {
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.getOrThrow<string>('GOOGLE_REDIRECT_URI');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const tokenId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, tokenId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save({
      id: tokenId,
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
