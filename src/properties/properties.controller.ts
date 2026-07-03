import { Controller, Post, Body, UseGuards, Get, Query, Param, Patch } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GetPropertiesDto } from './dto/get-properties.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  @Post()
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.create(createPropertyDto, userId);
  }

  @Public()
  @Get()
  findAll(@Query() query: GetPropertiesDto) {
    return this.propertiesService.getAllProperties(query);
  }

  @Get('my-properties')
  getMyProperties(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
  ) {
    return this.propertiesService.getMyProperties(userId, status);
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.propertiesService.getProperty(id, userId);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.publishProperty(id, userId);
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  unpublish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.unpublishProperty(id, userId);
  }
}
