import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { PatchSlotDto } from './dto/patch-slot.dto';
import { UpsertScheduleTemplatesDto } from './dto/upsert-schedule-templates.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@Controller()
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/artists/:artistId/schedule-templates')
  getTemplates(@Param('artistId') artistId: string) {
    return this.schedules.getTemplates(artistId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/artists/:artistId/schedule-templates')
  upsertTemplates(
    @CurrentUser() user: AuthUser,
    @Param('artistId') artistId: string,
    @Body() dto: UpsertScheduleTemplatesDto,
  ) {
    return this.schedules.upsertTemplates(user.userId, artistId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/artists/:artistId/slots/generate')
  generateSlots(
    @CurrentUser() user: AuthUser,
    @Param('artistId') artistId: string,
    @Body() dto: GenerateSlotsDto,
  ) {
    return this.schedules.generateSlots(user.userId, artistId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/slots/:slotId')
  patchSlot(
    @CurrentUser() user: AuthUser,
    @Param('slotId') slotId: string,
    @Body() dto: PatchSlotDto,
  ) {
    return this.schedules.patchSlot(user.userId, slotId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/artists/:artistId/slots')
  adminSlots(
    @Param('artistId') artistId: string,
    @Query() query: GenerateSlotsDto,
  ) {
    return this.schedules.adminSlots(artistId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST)
  @Get('artist/me/schedule')
  artistSchedule(
    @CurrentUser() user: AuthUser,
    @Query() query: GenerateSlotsDto,
  ) {
    return this.schedules.artistSchedule(user.userId, query);
  }
}
