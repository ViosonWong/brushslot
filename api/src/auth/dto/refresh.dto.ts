import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @IsString()
  @Length(20, 500)
  refreshToken!: string;
}
