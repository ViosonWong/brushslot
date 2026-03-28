import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class AdminUpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  adminNote?: string;
}
