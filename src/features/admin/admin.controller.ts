import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminService, UserListQuery } from './admin.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UserRole, UserStatus } from '../user/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/v1/admin/users
   * IT Admin + SA đều xem được
   * Query: ?search=&role=&status=
   */
  @Get('users')
  @Roles('IT', 'SA')
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
  ) {
    const query: UserListQuery = {};
    if (search) query.search = search;
    if (role && Object.values(UserRole).includes(role)) query.role = role;
    if (status && Object.values(UserStatus).includes(status))
      query.status = status;
    return this.adminService.listUsers(query);
  }

  /**
   * POST /api/v1/admin/users
   * Chỉ IT Admin
   */
  @Post('users')
  @Roles('IT')
  createUser(
    @Body() dto: CreateUserDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.adminService.createUser(dto, req.user.role);
  }

  /**
   * PATCH /api/v1/admin/users/:id
   * Chỉ IT Admin
   */
  @Patch('users/:id')
  @Roles('IT')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.adminService.updateUser(id, dto, req.user.id, req.user.role);
  }

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Chỉ IT Admin
   */
  @Patch('users/:id/status')
  @Roles('IT')
  toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.adminService.toggleStatus(id, req.user.id);
  }

  /**
   * POST /api/v1/admin/users/:id/reset-password
   * Chỉ IT Admin
   */
  @Post('users/:id/reset-password')
  @Roles('IT')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.adminService.resetPassword(id, dto);
  }
}
