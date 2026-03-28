import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArtistSlotsQuery } from './dto/artist-slots.query';
import { ArtistsService } from './artists.service';

@ApiTags('artists')
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  list() {
    return this.artists.list();
  }

  @Get(':artistId')
  get(@Param('artistId') artistId: string) {
    return this.artists.get(artistId);
  }

  @Get(':artistId/slots')
  slots(@Param('artistId') artistId: string, @Query() query: ArtistSlotsQuery) {
    return this.artists.slots(artistId, query);
  }
}
