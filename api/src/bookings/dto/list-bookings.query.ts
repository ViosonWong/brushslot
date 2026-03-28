import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class ListBookingsQuery {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
