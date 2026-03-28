import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, SlotStatus } from '@prisma/client';
import dayjs from '../common/dayjs';
import { toJsonValue } from '../common/utils/json-value';
import { PrismaService } from '../prisma/prisma.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';

function parseYmd(input: string) {
  const d = dayjs(input, 'YYYY-MM-DD', true);
  if (!d.isValid())
    throw new BadRequestException('Invalid date (YYYY-MM-DD expected)');
  return d.startOf('day');
}

@Injectable()
export class AttendanceService {
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

  async setAttendance(adminUserId: string, dto: SetAttendanceDto) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: dto.artistId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    const workDay = parseYmd(dto.workDate);
    const start = workDay.toDate();
    const end = workDay.endOf('day').toDate();

    const record = await this.prisma.attendanceRecord.upsert({
      where: { artistId_workDate: { artistId: dto.artistId, workDate: start } },
      create: {
        artistId: dto.artistId,
        workDate: start,
        status: dto.status,
        note: dto.note,
      },
      update: {
        status: dto.status,
        note: dto.note,
      },
      select: {
        id: true,
        artistId: true,
        workDate: true,
        status: true,
        note: true,
      },
    });

    if (
      dto.status === AttendanceStatus.LEAVE ||
      dto.status === AttendanceStatus.PAUSED ||
      dto.status === AttendanceStatus.ABSENT
    ) {
      await this.prisma.artistTimeSlot.updateMany({
        where: {
          artistId: dto.artistId,
          startAt: { gte: start, lte: end },
          status: SlotStatus.AVAILABLE,
        },
        data: { status: SlotStatus.OFF, note: dto.note ?? 'attendance: off' },
      });
    }

    await this.logAdmin(
      adminUserId,
      'SET_ATTENDANCE',
      'ArtistProfile',
      dto.artistId,
      dto,
    );

    return record;
  }
}
