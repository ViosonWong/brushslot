import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class SetAttendanceDto {
  @IsString()
  @Length(5, 80)
  artistId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  workDate!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
