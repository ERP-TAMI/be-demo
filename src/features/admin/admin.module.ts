import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { MailModule } from '../../mail/mail.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
