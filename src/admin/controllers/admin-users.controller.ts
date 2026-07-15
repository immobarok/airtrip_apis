import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { UpdateUserStatusDto } from '../dto/admin.dto';
import { AdminUsersService } from '../services/admin-users.service';

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.adminUsersService.getUsers(
      Number(page),
      Number(limit),
      role,
      isActiveBool,
    );
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, updateDto);
  }

  @Patch(':id/verify-host')
  async verifyHost(@Param('id') id: string) {
    return this.adminUsersService.verifyHost(id);
  }
}
