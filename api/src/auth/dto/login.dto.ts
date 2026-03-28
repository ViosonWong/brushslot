import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\+?\d{6,20}$/, {
    message: 'phone must be digits (optionally with +)',
  })
  phone!: string;

  @IsString()
  @Length(8, 72)
  password!: string;
}
