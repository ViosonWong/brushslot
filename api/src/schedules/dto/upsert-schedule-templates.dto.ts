import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleTemplateDto } from './schedule-template.dto';

export class UpsertScheduleTemplatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => ScheduleTemplateDto)
  templates!: ScheduleTemplateDto[];
}
