import { Controller, Post, Body, UseGuards, Get, Query, Param, Patch, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GetPropertiesDto } from './dto/get-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ManageAvailabilityDto } from './dto/manage-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('properties')
@UseGuards(JwtAuthGuard)
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

  @Public()
  @Get('destinations/top')
  getTopDestinations() {
    return this.propertiesService.getTopDestinations();
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.updateProperty(id, userId, updatePropertyDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.deleteProperty(id, userId);
  }

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.uploadPhotos(id, userId, files);
  }

  @Patch(':id/publish')
  publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.publishProperty(id, userId);
  }

  @Patch(':id/unpublish')
  unpublish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.unpublishProperty(id, userId);
  }

  @Public()
  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.propertiesService.getPropertyAvailability(id);
  }

  @Post(':id/availability/block')
  blockDates(
    @Param('id') id: string,
    @Body() dto: ManageAvailabilityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.blockDates(id, userId, dto.dates);
  }

  @Post(':id/availability/unblock')
  unblockDates(
    @Param('id') id: string,
    @Body() dto: ManageAvailabilityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.propertiesService.unblockDates(id, userId, dto.dates);
  }
}
