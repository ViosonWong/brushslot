import { IsOptional, IsString, Length } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @Length(5, 80)
  slotId!: string;

  @IsString()
  @Length(1, 50)
  contactName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  requestNote?: string;
}
