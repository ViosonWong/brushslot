import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, SlotStatus } from '@prisma/client';
import dayjs from '../common/dayjs';
import { toJsonValue } from '../common/utils/json-value';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateBookingStatusDto } from './dto/admin-update-booking-status.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQuery } from './dto/list-bookings.query';

@Injectable()
export class BookingsService {
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

  async create(customerId: string, dto: CreateBookingDto) {
    const slot = await this.prisma.artistTimeSlot.findUnique({
      where: { id: dto.slotId },
      select: {
        id: true,
        artistId: true,
        startAt: true,
        endAt: true,
        status: true,
        artist: {
          select: {
            id: true,
            isActive: true,
            displayName: true,
            user: { select: { isActive: true } },
          },
        },
        booking: { select: { id: true } },
      },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (!slot.artist.isActive || !slot.artist.user.isActive) {
      throw new BadRequestException('Artist not available');
    }
    if (slot.status !== SlotStatus.AVAILABLE)
      throw new BadRequestException('Slot not available');
    if (slot.booking) throw new BadRequestException('Slot already booked');
    if (dayjs(slot.startAt).isBefore(dayjs()))
      throw new BadRequestException('Slot already started');

    const booking = await this.prisma.$transaction(async (tx) => {
      // Re-check status inside the transaction.
      const lockedSlot = await tx.artistTimeSlot.findUnique({
        where: { id: slot.id },
        select: { id: true, status: true },
      });
      if (!lockedSlot || lockedSlot.status !== SlotStatus.AVAILABLE) {
        throw new BadRequestException('Slot not available');
      }

      const created = await tx.booking.create({
        data: {
          customerId,
          artistId: slot.artistId,
          slotId: slot.id,
          slotStartAt: slot.startAt,
          slotEndAt: slot.endAt,
          status: BookingStatus.PENDING,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          requestNote: dto.requestNote,
        },
        select: {
          id: true,
          status: true,
          contactName: true,
          contactPhone: true,
          requestNote: true,
          createdAt: true,
          slot: { select: { id: true, startAt: true, endAt: true } },
          artist: { select: { id: true, displayName: true } },
        },
      });

      await tx.artistTimeSlot.update({
        where: { id: slot.id },
        data: { status: SlotStatus.BOOKED },
      });

      return created;
    });

    return booking;
  }

  myBookings(customerId: string) {
    return this.prisma.booking
      .findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          contactName: true,
          contactPhone: true,
          requestNote: true,
          adminNote: true,
          cancelledAt: true,
          completedAt: true,
          createdAt: true,
          slotId: true,
          slotStartAt: true,
          slotEndAt: true,
          artist: { select: { id: true, displayName: true } },
          slot: { select: { status: true } },
        },
      })
      .then((rows) =>
        rows.map((b) => ({
          ...b,
          slot: {
            id: b.slotId,
            startAt: b.slotStartAt,
            endAt: b.slotEndAt,
            status: b.slot?.status,
          },
        })),
      );
  }

  async cancel(customerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        customerId: true,
        status: true,
        slotId: true,
        slotStartAt: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenException();
    if (booking.status === BookingStatus.CANCELLED) return { ok: true };
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.NO_SHOW
    ) {
      throw new BadRequestException('Cannot cancel a finished booking');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          slot: { disconnect: true },
        },
      });

      // Re-open the slot if it hasn't started yet.
      if (booking.slotId && dayjs(booking.slotStartAt).isAfter(dayjs())) {
        await tx.artistTimeSlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    });

    return { ok: true };
  }

  async artistBookings(artistUserId: string, query: ListBookingsQuery) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { userId: artistUserId },
      select: { id: true },
    });
    if (!artist) throw new NotFoundException('Artist profile not found');

    return this.prisma.booking
      .findMany({
        where: {
          artistId: artist.id,
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          contactName: true,
          contactPhone: true,
          requestNote: true,
          adminNote: true,
          cancelledAt: true,
          completedAt: true,
          createdAt: true,
          slotId: true,
          slotStartAt: true,
          slotEndAt: true,
        },
      })
      .then((rows) =>
        rows.map((b) => ({
          ...b,
          slot: { id: b.slotId, startAt: b.slotStartAt, endAt: b.slotEndAt },
        })),
      );
  }

  adminBookings(query: ListBookingsQuery) {
    return this.prisma.booking
      .findMany({
        where: query.status ? { status: query.status } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          contactName: true,
          contactPhone: true,
          requestNote: true,
          adminNote: true,
          cancelledAt: true,
          completedAt: true,
          createdAt: true,
          slotId: true,
          slotStartAt: true,
          slotEndAt: true,
          customer: { select: { id: true, phone: true, name: true } },
          artist: { select: { id: true, displayName: true } },
        },
      })
      .then((rows) =>
        rows.map((b) => ({
          ...b,
          slot: { id: b.slotId, startAt: b.slotStartAt, endAt: b.slotEndAt },
        })),
      );
  }

  async adminUpdateStatus(
    adminUserId: string,
    bookingId: string,
    dto: AdminUpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        slotId: true,
        slotStartAt: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const now = new Date();
    const data: Prisma.BookingUpdateInput = {
      status: dto.status,
      adminNote: dto.adminNote,
    };
    if (dto.status === BookingStatus.CANCELLED) {
      data.cancelledAt = now;
      data.slot = { disconnect: true };
    }
    if (dto.status === BookingStatus.COMPLETED) data.completedAt = now;

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: bookingId }, data });

      if (
        dto.status === BookingStatus.CANCELLED &&
        booking.slotId &&
        dayjs(booking.slotStartAt).isAfter(dayjs())
      ) {
        await tx.artistTimeSlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    });

    await this.logAdmin(
      adminUserId,
      'UPDATE_BOOKING_STATUS',
      'Booking',
      bookingId,
      dto,
    );

    return { ok: true };
  }
}
