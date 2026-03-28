import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @Matches(/^\+?\d{6,20}$/, {
    message: 'phone must be digits (optionally with +)',
  })
  phone!: string;

  @IsString()
  @Length(8, 72)
  password!: string;

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 60)
  displayName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

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
