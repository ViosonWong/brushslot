import { IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
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
}
