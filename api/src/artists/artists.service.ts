import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SlotStatus } from '@prisma/client';
import dayjs from '../common/dayjs';
import { PrismaService } from '../prisma/prisma.service';

function parseYmd(input: string) {
  const d = dayjs(input, 'YYYY-MM-DD', true);
  if (!d.isValid())
    throw new BadRequestException('Invalid date (YYYY-MM-DD expected)');
  return d;
}

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.artistProfile.findMany({
      where: { isActive: true, user: { isActive: true } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        bio: true,
        slotDurationMin: true,
        advanceDays: true,
      },
    });
  }

  async get(artistId: string) {
    const artist = await this.prisma.artistProfile.findFirst({
      where: { id: artistId, isActive: true, user: { isActive: true } },
      select: {
        id: true,
        displayName: true,
        bio: true,
        slotDurationMin: true,
        advanceDays: true,
      },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async slots(artistId: string, input: { from?: string; to?: string }) {
    // Ensure artist exists and is active.
    await this.get(artistId);

    const from = input.from ? parseYmd(input.from) : dayjs().startOf('day');
    const to = input.to
      ? parseYmd(input.to).endOf('day')
      : dayjs().add(14, 'day').endOf('day');

    if (to.isBefore(from)) throw new BadRequestException('Invalid date range');

    return this.prisma.artistTimeSlot.findMany({
      where: {
        artistId,
        startAt: { gte: from.toDate(), lte: to.toDate() },
        status: SlotStatus.AVAILABLE,
      },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });
  }
}
