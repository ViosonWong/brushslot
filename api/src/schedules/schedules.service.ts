import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SlotStatus } from '@prisma/client';
import dayjs from '../common/dayjs';
import { toJsonValue } from '../common/utils/json-value';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { PatchSlotDto } from './dto/patch-slot.dto';
import { UpsertScheduleTemplatesDto } from './dto/upsert-schedule-templates.dto';

function parseTimeToMinutes(value: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new BadRequestException('Invalid time (HH:mm expected)');
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    throw new BadRequestException('Invalid time (HH:mm expected)');
  }
  return hh * 60 + mm;
}

function parseYmd(input: string) {
  const d = dayjs(input, 'YYYY-MM-DD', true);
  if (!d.isValid())
    throw new BadRequestException('Invalid date (YYYY-MM-DD expected)');
  return d.startOf('day');
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async upsertTemplates(
    adminUserId: string,
    artistId: string,
    dto: UpsertScheduleTemplatesDto,
  ) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    // Basic validation: end must be after start.
    for (const t of dto.templates) {
      const start = parseTimeToMinutes(t.startTime);
      const end = parseTimeToMinutes(t.endTime);
      if (end <= start)
        throw new BadRequestException('endTime must be after startTime');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.weeklyScheduleTemplate.deleteMany({ where: { artistId } });
      await tx.weeklyScheduleTemplate.createMany({
        data: dto.templates.map((t) => ({
          artistId,
          weekday: t.weekday,
          startTime: t.startTime,
          endTime: t.endTime,
          isEnabled: t.isEnabled ?? true,
        })),
      });
    });

    await this.logAdmin(
      adminUserId,
      'UPSERT_SCHEDULE_TEMPLATES',
      'ArtistProfile',
      artistId,
      dto,
    );

    return { ok: true };
  }

  async getTemplates(artistId: string) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    return this.prisma.weeklyScheduleTemplate.findMany({
      where: { artistId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        weekday: true,
        startTime: true,
        endTime: true,
        isEnabled: true,
      },
    });
  }

  async generateSlots(
    adminUserId: string,
    artistId: string,
    dto: GenerateSlotsDto,
  ) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
      select: { id: true, slotDurationMin: true, advanceDays: true },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    const from = dto.from ? parseYmd(dto.from) : dayjs().startOf('day');
    const to = dto.to
      ? parseYmd(dto.to).endOf('day')
      : dayjs().add(artist.advanceDays, 'day').endOf('day');
    if (to.isBefore(from)) throw new BadRequestException('Invalid date range');

    const templates = await this.prisma.weeklyScheduleTemplate.findMany({
      where: { artistId, isEnabled: true },
      select: { weekday: true, startTime: true, endTime: true },
    });
    if (templates.length === 0)
      throw new BadRequestException('No enabled schedule templates');

    const byWeekday = new Map<
      number,
      { startTime: string; endTime: string }[]
    >();
    for (const t of templates) {
      const list = byWeekday.get(t.weekday) ?? [];
      list.push({ startTime: t.startTime, endTime: t.endTime });
      byWeekday.set(t.weekday, list);
    }

    const data: {
      artistId: string;
      startAt: Date;
      endAt: Date;
      status: SlotStatus;
      source: string;
    }[] = [];
    const durationMin = Math.max(15, Math.min(240, artist.slotDurationMin));

    let curDay = from.startOf('day');
    const endDay = to.startOf('day');
    while (curDay.isSame(endDay) || curDay.isBefore(endDay)) {
      const weekday = curDay.day(); // 0-6
      const dayTemplates = byWeekday.get(weekday) ?? [];
      for (const t of dayTemplates) {
        const startMin = parseTimeToMinutes(t.startTime);
        const endMin = parseTimeToMinutes(t.endTime);
        const windowStart = curDay.add(startMin, 'minute');
        const windowEnd = curDay.add(endMin, 'minute');
        let slotStart = windowStart;
        while (!slotStart.add(durationMin, 'minute').isAfter(windowEnd)) {
          const slotEnd = slotStart.add(durationMin, 'minute');
          if (slotEnd.isAfter(dayjs())) {
            data.push({
              artistId,
              startAt: slotStart.toDate(),
              endAt: slotEnd.toDate(),
              status: SlotStatus.AVAILABLE,
              source: 'template',
            });
          }
          slotStart = slotStart.add(durationMin, 'minute');
        }
      }
      curDay = curDay.add(1, 'day');
    }

    if (data.length === 0) return { created: 0 };

    const res = await this.prisma.artistTimeSlot.createMany({
      data,
      skipDuplicates: true,
    });

    await this.logAdmin(
      adminUserId,
      'GENERATE_SLOTS',
      'ArtistProfile',
      artistId,
      dto,
    );

    return { created: res.count };
  }

  async patchSlot(adminUserId: string, slotId: string, dto: PatchSlotDto) {
    if (dto.status === SlotStatus.BOOKED) {
      throw new BadRequestException('SlotStatus.BOOKED is managed by bookings');
    }

    const slot = await this.prisma.artistTimeSlot.findUnique({
      where: { id: slotId },
      select: { id: true, status: true, booking: { select: { id: true } } },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.booking)
      throw new BadRequestException('Cannot modify a booked slot');

    const updated = await this.prisma.artistTimeSlot.update({
      where: { id: slotId },
      data: { status: dto.status, note: dto.note },
      select: {
        id: true,
        artistId: true,
        startAt: true,
        endAt: true,
        status: true,
        note: true,
      },
    });

    await this.logAdmin(
      adminUserId,
      'PATCH_SLOT',
      'ArtistTimeSlot',
      slotId,
      dto,
    );

    return updated;
  }

  async adminSlots(artistId: string, input: { from?: string; to?: string }) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    const from = input.from ? parseYmd(input.from) : dayjs().startOf('day');
    const to = input.to
      ? parseYmd(input.to).endOf('day')
      : dayjs().add(14, 'day').endOf('day');
    if (to.isBefore(from)) throw new BadRequestException('Invalid date range');

    return this.prisma.artistTimeSlot.findMany({
      where: { artistId, startAt: { gte: from.toDate(), lte: to.toDate() } },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        note: true,
        booking: {
          select: {
            id: true,
            status: true,
            contactName: true,
            contactPhone: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async artistSchedule(userId: string, input: { from?: string; to?: string }) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException('Artist profile not found');

    const from = input.from ? parseYmd(input.from) : dayjs().startOf('day');
    const to = input.to
      ? parseYmd(input.to).endOf('day')
      : dayjs().add(14, 'day').endOf('day');
    if (to.isBefore(from)) throw new BadRequestException('Invalid date range');

    return this.prisma.artistTimeSlot.findMany({
      where: {
        artistId: artist.id,
        startAt: { gte: from.toDate(), lte: to.toDate() },
      },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        note: true,
        booking: {
          select: {
            id: true,
            status: true,
            contactName: true,
            requestNote: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
