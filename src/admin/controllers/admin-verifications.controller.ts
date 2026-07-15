import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminVerificationsService } from '../services/admin-verifications.service';

@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminVerificationsController {
  constructor(
    private readonly verificationsService: AdminVerificationsService,
  ) {}

  @Get()
  async getVerifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.verificationsService.getVerifications(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Patch(':id/status')
  async verifyDocument(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    const data = await this.verificationsService.verifyDocument(id, isApproved);
    return { success: true, data };
  }
}
