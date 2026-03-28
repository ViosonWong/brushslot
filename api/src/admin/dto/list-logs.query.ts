import { IsOptional, IsString, Length } from 'class-validator';

export class ListLogsQuery {
  @IsOptional()
  @IsString()
  @Length(0, 80)
  targetType?: string;
}
