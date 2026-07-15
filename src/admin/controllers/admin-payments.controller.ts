import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { AdminPaymentsService } from '../services/admin-payments.service';

@Controller('admin/payments')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get()
  async getPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.adminPaymentsService.getPayments(
      Number(page),
      Number(limit),
      status,
    );
  }

  @Post(':id/process-payout')
  async processPayout(@Param('id') id: string) {
    return this.adminPaymentsService.processPayout(id);
  }
}
