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
import { AdminPromotionsService } from '../services/admin-promotions.service';

@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPromotionsController {
  constructor(private readonly promotionsService: AdminPromotionsService) {}

  @Get()
  async getPromotions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.promotionsService.getPromotions(
      parseInt(page),
      parseInt(limit),
    );
  }

  @Patch(':id/status')
  async togglePromotion(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const data = await this.promotionsService.togglePromotion(id, isActive);
    return { success: true, data };
  }
}
