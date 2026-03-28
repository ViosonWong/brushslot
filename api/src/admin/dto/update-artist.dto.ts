import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  slotDurationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(90)
  advanceDays?: number;
}
