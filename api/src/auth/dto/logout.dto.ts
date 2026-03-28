import { IsString, Length } from 'class-validator';

export class LogoutDto {
  @IsString()
  @Length(20, 500)
  refreshToken!: string;
}
