import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { AdminService } from './admin.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { ListLogsQuery } from './dto/list-logs.query';
import { UpdateArtistDto } from './dto/update-artist.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('artists')
  listArtists() {
    return this.admin.listArtists();
  }

  @Post('artists')
  createArtist(@CurrentUser() user: AuthUser, @Body() dto: CreateArtistDto) {
    return this.admin.createArtist(user.userId, dto);
  }

  @Patch('artists/:artistId')
  updateArtist(
    @CurrentUser() user: AuthUser,
    @Param('artistId') artistId: string,
    @Body() dto: UpdateArtistDto,
  ) {
    return this.admin.updateArtist(user.userId, artistId, dto);
  }

  @Get('logs')
  logs(@Query() query: ListLogsQuery) {
    return this.admin.logs(query);
  }
}
