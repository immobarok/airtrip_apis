import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { ModerateReviewDto } from '../dto/admin.dto';
import { AdminReviewsService } from '../services/admin-reviews.service';

@Controller('admin/reviews')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get()
  async getReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('isReported') isReported?: string,
  ) {
    const isReportedBool =
      isReported === 'true' ? true : isReported === 'false' ? false : undefined;
    return this.adminReviewsService.getReviews(
      Number(page),
      Number(limit),
      isReportedBool,
    );
  }

  @Patch(':id/moderate')
  async moderateReview(
    @Param('id') id: string,
    @Body() moderateDto: ModerateReviewDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.id;
    return this.adminReviewsService.moderateReview(id, moderateDto, adminId);
  }
}
