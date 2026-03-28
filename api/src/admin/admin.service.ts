import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { toJsonValue } from '../common/utils/json-value';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { ListLogsQuery } from './dto/list-logs.query';
import { UpdateArtistDto } from './dto/update-artist.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePhone(phone: string) {
    return phone.replace(/[\s-]/g, '');
  }

  private async logAdmin(
    adminUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    payload?: unknown,
  ) {
    await this.prisma.adminOperationLog.create({
      data: {
        adminUserId,
        action,
        targetType,
        targetId,
        payload: toJsonValue(payload),
      },
    });
  }

  listArtists() {
    return this.prisma.artistProfile.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        isActive: true,
        slotDurationMin: true,
        advanceDays: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  async createArtist(adminUserId: string, dto: CreateArtistDto) {
    const phone = this.normalizePhone(dto.phone);
    const exists = await this.prisma.user.findUnique({ where: { phone } });
    if (exists) throw new BadRequestException('Phone already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const artist = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          passwordHash,
          name: dto.name,
          role: UserRole.ARTIST,
        },
        select: { id: true, phone: true, name: true },
      });

      return tx.artistProfile.create({
        data: {
          userId: user.id,
          displayName: dto.displayName,
          bio: dto.bio,
          slotDurationMin: dto.slotDurationMin ?? 60,
          advanceDays: dto.advanceDays ?? 30,
        },
        select: {
          id: true,
          displayName: true,
          bio: true,
          slotDurationMin: true,
          advanceDays: true,
          isActive: true,
          user: { select: { id: true, phone: true, name: true } },
        },
      });
    });

    await this.logAdmin(
      adminUserId,
      'CREATE_ARTIST',
      'ArtistProfile',
      artist.id,
      {
        phone,
        displayName: dto.displayName,
      },
    );

    return artist;
  }

  async updateArtist(
    adminUserId: string,
    artistId: string,
    dto: UpdateArtistDto,
  ) {
    const exists = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Artist not found');

    const artist = await this.prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        isActive: dto.isActive,
        slotDurationMin: dto.slotDurationMin,
        advanceDays: dto.advanceDays,
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        isActive: true,
        slotDurationMin: true,
        advanceDays: true,
      },
    });

    await this.logAdmin(
      adminUserId,
      'UPDATE_ARTIST',
      'ArtistProfile',
      artistId,
      dto,
    );

    return artist;
  }

  logs(query: ListLogsQuery) {
    return this.prisma.adminOperationLog.findMany({
      where: query.targetType ? { targetType: query.targetType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        payload: true,
        createdAt: true,
        adminUser: { select: { id: true, phone: true, name: true } },
      },
    });
  }
}
