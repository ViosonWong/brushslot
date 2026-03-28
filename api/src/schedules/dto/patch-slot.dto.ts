import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { SlotStatus } from '@prisma/client';

export class PatchSlotDto {
  @IsEnum(SlotStatus)
  status!: SlotStatus;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
