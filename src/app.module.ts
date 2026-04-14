import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { UserModule } from './features/user/user.module.js';
import { AuthModule } from './features/auth/auth.module.js';
import { AdminModule } from './features/admin/admin.module.js';
import { MailModule } from './mail/mail.module.js';
import { MastersModule } from './features/masters/masters.module.js';
import { PurchaseOrdersModule } from './features/purchase-orders/purchase-orders.module.js';
import { PoLinesModule } from './features/po-lines/po-lines.module.js';
import { BomsModule } from './features/boms/boms.module.js';
import { ProductionPlansModule } from './features/production-plans/production-plans.module.js';
import { UploadsModule } from './features/uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    MailModule,
    UserModule,
    AuthModule,
    AdminModule,
    MastersModule,
    PurchaseOrdersModule,
    PoLinesModule,
    BomsModule,
    ProductionPlansModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
