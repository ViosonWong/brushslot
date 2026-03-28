import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type PublicUser = {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private normalizePhone(phone: string) {
    return phone.replace(/[\s-]/g, '');
  }

  private sha256(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private async issueTokens(user: PublicUser): Promise<AuthTokens> {
    const refreshDays = Number(
      this.config.get<string>('REFRESH_TOKEN_DAYS', '7'),
    );
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.role,
      },
      {
        expiresIn: accessTtl as never,
      },
    );

    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const tokenHash = this.sha256(refreshToken);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: string;
    phone: string;
    role: UserRole;
    name: string;
  }): PublicUser {
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
    };
  }

  async register(input: { phone: string; password: string; name: string }) {
    const phone = this.normalizePhone(input.phone);

    const exists = await this.prisma.user.findUnique({ where: { phone } });
    if (exists) throw new BadRequestException('Phone already registered');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        phone,
        passwordHash,
        name: input.name,
        role: UserRole.CUSTOMER,
      },
      select: {
        id: true,
        phone: true,
        role: true,
        name: true,
      },
    });

    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async login(input: { phone: string; password: string }) {
    const phone = this.normalizePhone(input.phone);
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        role: true,
        name: true,
        isActive: true,
        passwordHash: true,
      },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const publicUser = this.toPublicUser(user);
    const tokens = await this.issueTokens(publicUser);
    return { user: publicUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.sha256(refreshToken);

    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });
    if (!token) throw new UnauthorizedException('Invalid refresh token');
    if (token.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken
        .delete({ where: { id: token.id } })
        .catch(() => undefined);
      throw new UnauthorizedException('Expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: token.userId },
      select: { id: true, phone: true, role: true, name: true, isActive: true },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('User inactive');

    // Rotate refresh token.
    await this.prisma.refreshToken.delete({ where: { id: token.id } });
    const tokens = await this.issueTokens(user);
    return { user, ...tokens };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.sha256(refreshToken);
    await this.prisma.refreshToken
      .delete({ where: { tokenHash } })
      .catch(() => undefined);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, role: true, name: true, isActive: true },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('User inactive');
    return user;
  }
}
