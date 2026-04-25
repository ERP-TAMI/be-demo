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
import { UploadModule } from './features/upload/upload.module.js';
import { ProductionDocsModule } from './features/production-docs/production-docs.module.js';
import { StylesModule } from './features/styles/styles.module.js';
import { ColorsModule } from './features/colors/colors.module.js';
import { SamplesModule } from './features/samples/samples.module.js';
import { DraftBomsModule } from './features/draft-boms/draft-boms.module.js';
import { MasterPosModule } from './features/master-pos/master-pos.module.js';
import { DocFoldersModule } from './features/doc-folders/doc-folders.module.js';

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
    UploadModule,
    ProductionDocsModule,
    StylesModule,
    ColorsModule,
    SamplesModule,
    DraftBomsModule,
    MasterPosModule,
    DocFoldersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
