import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { AttendanceService } from './attendance.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';

@ApiTags('attendance')
@Controller('admin/attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  set(@CurrentUser() user: AuthUser, @Body() dto: SetAttendanceDto) {
    return this.attendance.setAttendance(user.userId, dto);
  }
}
