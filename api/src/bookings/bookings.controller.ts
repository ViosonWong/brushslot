import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { AdminUpdateBookingStatusDto } from './dto/admin-update-booking-status.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQuery } from './dto/list-bookings.query';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Post('bookings')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('bookings/me')
  myBookings(@CurrentUser() user: AuthUser) {
    return this.bookings.myBookings(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Patch('bookings/:bookingId/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('bookingId') bookingId: string) {
    return this.bookings.cancel(user.userId, bookingId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST)
  @Get('artist/me/bookings')
  artistBookings(
    @CurrentUser() user: AuthUser,
    @Query() query: ListBookingsQuery,
  ) {
    return this.bookings.artistBookings(user.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/bookings')
  adminBookings(@Query() query: ListBookingsQuery) {
    return this.bookings.adminBookings(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/bookings/:bookingId/status')
  adminUpdateStatus(
    @CurrentUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: AdminUpdateBookingStatusDto,
  ) {
    return this.bookings.adminUpdateStatus(user.userId, bookingId, dto);
  }
}
