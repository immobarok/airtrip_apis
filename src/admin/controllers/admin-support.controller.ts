import {
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
import { AdminSupportService } from '../services/admin-support.service';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSupportController {
  constructor(private readonly supportService: AdminSupportService) {}

  @Get()
  async getTickets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.supportService.getTickets(parseInt(page), parseInt(limit));
  }

  @Patch(':id/resolve')
  async resolveTicket(@Param('id') id: string) {
    const data = await this.supportService.resolveTicket(id);
    return { success: true, data };
  }
}
