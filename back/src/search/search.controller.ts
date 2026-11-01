import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.searchAll(query.q, query.limit || 5);
  }
}