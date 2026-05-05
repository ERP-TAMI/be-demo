/**
 * SEED SCRIPT — ERP May Mặc
 * Usage: npm run seed:all
 * Seeds: users, materials, stages, workshops, purchase_orders, po_lines, colors, sizes, boms, production_plans
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

// ─── Entities ──────────────────────────────────────────────────────────────────
import {
  User,
  UserRole,
  UserStatus,
} from '../../features/user/entities/user.entity';
import {
  Material,
  MaterialStatus,
} from '../../features/masters/entities/material.entity';
import { MaterialGroup } from '../../features/masters/entities/material-group.entity';
import {
  Stage,
  StageStatus,
} from '../../features/masters/entities/stage.entity';
import { StageGroup, StageGroupStatus } from '../../features/masters/entities/stage-group.entity';
import { StageGroupItem } from '../../features/masters/entities/stage-group-item.entity';
import {
  Workshop,
  WorkshopStatus,
} from '../../features/masters/entities/workshop.entity';
import {
  PurchaseOrder,
  PoStatus,
} from '../../features/purchase-orders/entities/purchase-order.entity';

import {
  PoVersionLog,
  PoEventType,
} from '../../features/purchase-orders/entities/po-version-log.entity';
import {
  PoLine,
  LineCategory,
  LineStatus,
} from '../../features/po-lines/entities/po-line.entity';
import { LineColor } from '../../features/po-lines/entities/line-color.entity';
import { LineColorSize } from '../../features/po-lines/entities/line-color-size.entity';
import { LineAs3bStep } from '../../features/po-lines/entities/line-as3b-step.entity';
import {
  LineSample,
  SampleStatus,
} from '../../features/po-lines/entities/line-sample.entity';
import { Bom, BomStatus } from '../../features/boms/entities/bom.entity';
import { BomLine } from '../../features/boms/entities/bom-line.entity';
import { ProductionPlan } from '../../features/production-plans/entities/production-plan.entity';
import { DailyPlan } from '../../features/production-plans/entities/daily-plan.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_demo',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ DB Connected');

  // ─── Users ────────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding users...');
  const userRepo = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const users: Partial<User>[] = [
    {
      email: 'admin@erp.local',
      fullName: 'Super Admin',
      role: UserRole.IT,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
    {
      email: 'tpkh@erp.local',
      fullName: 'Trần Văn TPKH',
      role: UserRole.TPKH,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
    {
      email: 'rd@erp.local',
      fullName: 'Nguyễn Thị RD',
      role: UserRole.RD,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
    {
      email: 'sa@erp.local',
      fullName: 'Lê Văn SA',
      role: UserRole.SA,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
    {
      email: 'nvkh@erp.local',
      fullName: 'Phạm Thị NVKH',
      role: UserRole.NVKH,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
    {
      email: 'kt@erp.local',
      fullName: 'Hoàng Văn KT',
      role: UserRole.KT,
      status: UserStatus.ACTIVE,
      passwordHash,
      mustChangePassword: false,
    },
  ];

  const savedUsers: Record<string, User> = {};
  for (const u of users) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (!user) {
      user = await userRepo.save(userRepo.create(u));
    }
    savedUsers[u.role!] = user;
  }
  console.log(`  → ${Object.keys(savedUsers).length} users seeded`);

  // ─── Material Groups ─────────────────────────────────────────────────────────
  console.log('🌱 Seeding material groups...');
  const mgRepo = AppDataSource.getRepository(MaterialGroup);
  const groupNames = [
    'FUSIBLE',
    'TAPE',
    'MAIN LABEL',
    'SIZE LABEL (SIZECOO)',
    'CARE LABEL',
    'HANGTAG',
    'JOKER TAG',
    'SWIFTACK',
    'HANGER',
    'ĐỆM VAI',
    'ZIPPER',
    'ZIPPER TAPE',
    'ZIPPER PULL',
    'BUTTON',
  ];
  const groupMap: Record<string, MaterialGroup> = {};
  for (let i = 0; i < groupNames.length; i++) {
    let group = await mgRepo.findOne({ where: { name: groupNames[i] } });
    if (!group) {
      group = mgRepo.create({ name: groupNames[i], displayOrder: i + 1 });
      group = await mgRepo.save(group);
    }
    groupMap[groupNames[i]] = group;
  }
  console.log(`  → ${Object.keys(groupMap).length} material groups seeded`);

  // ─── Materials ───────────────────────────────────────────────────────────────
  console.log('🌱 Seeding materials...');
  const matRepo = AppDataSource.getRepository(Material);
  const materialsData = [
    // FUSIBLE
    {
      materialCode: 'FUS-BLK',
      materialName: 'FUSIBLE BLK',
      materialGroupId: groupMap['FUSIBLE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    {
      materialCode: 'FUS-WHT',
      materialName: 'FUSIBLE WHT',
      materialGroupId: groupMap['FUSIBLE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    // TAPE
    {
      materialCode: 'TAPE-001',
      materialName: 'TAPE CLEAR 1/4',
      materialGroupId: groupMap['TAPE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    // MAIN LABEL
    {
      materialCode: 'ML-001',
      materialName: 'SL-08 SOHO APPAREL WHITE',
      materialGroupId: groupMap['MAIN LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ML-002',
      materialName: 'SL-01 SOHO APPAREL (BLK/SILVER)',
      materialGroupId: groupMap['MAIN LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ML-003',
      materialName: 'NICOLLEMNX',
      materialGroupId: groupMap['MAIN LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // SIZE LABEL (SIZECOO)
    {
      materialCode: 'SL-001',
      materialName: 'SL-10 SOHO WHITE',
      materialGroupId: groupMap['SIZE LABEL (SIZECOO)'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SL-002',
      materialName: 'NICOLLESZN',
      materialGroupId: groupMap['SIZE LABEL (SIZECOO)'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // CARE LABEL
    {
      materialCode: 'CL-001',
      materialName: 'SL-09',
      materialGroupId: groupMap['CARE LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'CL-002',
      materialName: 'SL-04 COLOR BLK/WHT',
      materialGroupId: groupMap['CARE LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'CL-003',
      materialName: 'WHITE SATIN LABEL WITH BLACK LETTERS (ENGLISH/SPANISH)',
      materialGroupId: groupMap['CARE LABEL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // HANGTAG
    {
      materialCode: 'HT-001',
      materialName: 'SL-07 SOHO APPAREL PX TAG MSRP $60.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-002',
      materialName: 'SL-02 SOHO APPAREL PX TAG MSRP $60.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-003',
      materialName: 'SL-07 SOHO APPAREL PX TAG MSRP $55.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-004',
      materialName: 'SL-21 SOHO APPAREL NO MSRP',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-005',
      materialName: 'SL-07 SOHO APPAREL NO MSRP',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-006',
      materialName: 'SL-07 SOHO APPAREL PX TAG MSRP $30.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-007',
      materialName: 'SL-02 SOHO APPAREL PX TAG MSRP $30.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-008',
      materialName: 'SL-02 SOHO APPAREL PX TAG MSRP $35.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-009',
      materialName: 'SL-07 SOHO APPAREL PX TAG MSRP $48.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-010',
      materialName: 'SL-02 SOHO APPAREL PX TAG MSRP $48.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-011',
      materialName: 'SL-02 SOHO APPAREL PX TAG MSRP $55.00',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-012',
      materialName: 'SL-49 FLARE',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-013',
      materialName: 'SL-28 FLARE LEG',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-014',
      materialName: 'SL-31 WIDE LEG',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-015',
      materialName: 'SL-38 CULOTTE',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-016',
      materialName: 'SL-48 WIDE LEG',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-017',
      materialName: 'SL-45 PETITE HANGTAG',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-018',
      materialName: 'SL-47 CROP',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-019',
      materialName: 'SL-40 BURLINGTON PETITE',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HT-020',
      materialName: 'NICOLLE WITH RFID',
      materialGroupId: groupMap['HANGTAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // JOKER TAG
    {
      materialCode: 'JK-001',
      materialName: 'SL-16 SOHO APPAREL WHITE',
      materialGroupId: groupMap['JOKER TAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'JK-002',
      materialName: 'SL-03 SOHO APPAREL',
      materialGroupId: groupMap['JOKER TAG'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // SWIFTACK
    {
      materialCode: 'SA-001',
      materialName: '1" CLEAR',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SA-002',
      materialName: '1" BLACK',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SA-003',
      materialName: '2" CLEAR',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SA-004',
      materialName: '3" CLEAR',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SA-005',
      materialName: '7" CLEAR',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'SA-006',
      materialName: '9" CLEAR',
      materialGroupId: groupMap['SWIFTACK'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // HANGER
    {
      materialCode: 'HG-001',
      materialName: '484-17',
      materialGroupId: groupMap['HANGER'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HG-002',
      materialName: '6012-12',
      materialGroupId: groupMap['HANGER'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'HG-003',
      materialName: '6212-12',
      materialGroupId: groupMap['HANGER'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // ĐỆM VAI
    {
      materialCode: 'SP-001',
      materialName: 'VN497',
      materialGroupId: groupMap['ĐỆM VAI'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // ZIPPER
    {
      materialCode: 'ZP-001',
      materialName: 'VN564 GUNMETAL',
      materialGroupId: groupMap['ZIPPER'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // ZIPPER TAPE
    {
      materialCode: 'ZT-001',
      materialName: 'ADMIRAL',
      materialGroupId: groupMap['ZIPPER TAPE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZT-002',
      materialName: 'BLK',
      materialGroupId: groupMap['ZIPPER TAPE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZT-003',
      materialName: 'LATTE',
      materialGroupId: groupMap['ZIPPER TAPE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZT-004',
      materialName: 'BROWN',
      materialGroupId: groupMap['ZIPPER TAPE'].id,
      unit: 'Mét',
      defaultYieldPct: 5,
      lastUnitCost: 0,
    },
    // ZIPPER PULL
    {
      materialCode: 'ZP-P001',
      materialName: 'VN-133 GOLD',
      materialGroupId: groupMap['ZIPPER PULL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZP-P002',
      materialName: 'VN-133 SILVER',
      materialGroupId: groupMap['ZIPPER PULL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZP-P003',
      materialName: 'VN-060 ANTI GOLD',
      materialGroupId: groupMap['ZIPPER PULL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    {
      materialCode: 'ZP-P004',
      materialName: 'VN-060 GOLD',
      materialGroupId: groupMap['ZIPPER PULL'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
    // BUTTON
    {
      materialCode: 'BT-001',
      materialName: '40L P.RIM SHINY BUTTON - DTM',
      materialGroupId: groupMap['BUTTON'].id,
      unit: 'Cái',
      defaultYieldPct: 2,
      lastUnitCost: 0,
    },
  ];

  const savedMaterials: Record<string, Material> = {};
  for (const m of materialsData) {
    let mat = await matRepo.findOne({
      where: { materialCode: m.materialCode },
    });
    if (!mat) {
      mat = await matRepo.save(
        matRepo.create({ ...m, status: MaterialStatus.ACTIVE }),
      );
    }
    savedMaterials[m.materialCode] = mat;
  }
  console.log(`  → ${materialsData.length} materials seeded`);

  // ─── Stages ──────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding stages...');
  const stageRepo = AppDataSource.getRepository(Stage);
  const stagesData = [
    {
      stageCode: 'GD-KANSAI-LAI',
      stageName: 'Kansai lai',
      description: 'Kansai lai',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-TP',
      stageName: 'Ủi TP',
      description: 'Ủi TP',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-TP-PHA-HOI',
      stageName: 'Ủi TP + phà hơi',
      description: 'Ủi TP + phà hơi',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-TP-UI-LY-SONG',
      stageName: 'Ủi TP + ủi ly + sóng',
      description: 'Ủi TP + ủi ly + sóng',
      ssv: 10,
    },
    {
      stageCode: 'GD-GAP-XEP',
      stageName: 'Gấp xếp',
      description: 'Gấp xếp',
      ssv: 10,
    },
    {
      stageCode: 'GD-BAN-DAN-DAY-NIT',
      stageName: 'Bắn đạn dây nịt',
      description: 'Bắn đạn dây nịt',
      ssv: 10,
    },
    {
      stageCode: 'GD-XO-THAT-DAY-NIT',
      stageName: 'Xỏ thắt dây nịt',
      description: 'Xỏ thắt dây nịt',
      ssv: 10,
    },
    {
      stageCode: 'GD-LUOT-NHAN-XUONG-CAT',
      stageName: 'Lượt nhãn – XƯỞNG CẮT',
      description: 'Lượt nhãn – XƯỞNG CẮT',
      ssv: 10,
    },
    {
      stageCode: 'GD-GAN-NHAN',
      stageName: 'Gắn nhãn',
      description: 'Gắn nhãn',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-GAP-LUNG-LOT-X2',
      stageName: 'Ủi CT – Ủi gấp lưng lót x2',
      description: 'Ủi CT – Ủi gấp lưng lót x2',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-THAN',
      stageName: 'Ủi CT – Ủi keo thân',
      description: 'Ủi CT – Ủi keo thân',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-THAN-SAU',
      stageName: 'Ủi CT – Ủi keo thân sau',
      description: 'Ủi CT – Ủi keo thân sau',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-TUI',
      stageName: 'Ủi CT – Ủi keo túi',
      description: 'Ủi CT – Ủi keo túi',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-NEP-TUI',
      stageName: 'Ủi CT – Ủi keo nẹp túi',
      description: 'Ủi CT – Ủi keo nẹp túi',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-EP-KEO-NEP-TUI-SAU',
      stageName: 'Ủi CT – Ép keo nẹp túi sau',
      description: 'Ủi CT – Ép keo nẹp túi sau',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-LUNG',
      stageName: 'Ủi CT – Ủi keo lưng',
      description: 'Ủi CT – Ủi keo lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-TS',
      stageName: 'Ủi CT – Ủi keo TS',
      description: 'Ủi CT – Ủi keo TS',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-NTS',
      stageName: 'Ủi CT – Ủi keo NTS',
      description: 'Ủi CT – Ủi keo NTS',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-TT',
      stageName: 'Ủi CT – Ủi keo TT',
      description: 'Ủi CT – Ủi keo TT',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-KEO-PAGET',
      stageName: 'Ủi CT – Ủi keo paget',
      description: 'Ủi CT – Ủi keo paget',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-CT-UI-GAP-TUI',
      stageName: 'Ủi CT – Ủi gấp túi',
      description: 'Ủi CT – Ủi gấp túi',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-CAT-DAY-PATSAN-X1-X2-X5',
      stageName: 'Chạy cắt dây patsan (X1, X2, X5)',
      description: 'Chạy cắt dây patsan (X1, X2, X5)',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-CAT-PASSANT',
      stageName: 'Chạy + cắt passant',
      description: 'Chạy + cắt passant',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-KANSAI-LUNG-CAT',
      stageName: 'Chạy kansai lưng + cắt',
      description: 'Chạy kansai lưng + cắt',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-DAY-VIEN-LUNG',
      stageName: 'Chạy dây viền lưng',
      description: 'Chạy dây viền lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-DAY-VIEN',
      stageName: 'Chạy dây viền',
      description: 'Chạy dây viền',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-DAY-VIEN-DO-CAT-DAY-VIEN',
      stageName: 'Chạy dây viền + đo cắt dây viền',
      description: 'Chạy dây viền + đo cắt dây viền',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-DAY-VIEN',
      stageName: 'Ủi dây viền',
      description: 'Ủi dây viền',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-DAY-VIEN-CAT',
      stageName: 'Ủi dây viền + cắt',
      description: 'Ủi dây viền + cắt',
      ssv: 10,
    },
    {
      stageCode: 'GD-MAY-LON-DAU-LUNG',
      stageName: 'May lộn đầu lưng',
      description: 'May lộn đầu lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-MAY-LON-DAY-KHOEN',
      stageName: 'May lộn dây khoen',
      description: 'May lộn dây khoen',
      ssv: 10,
    },
    {
      stageCode: 'GD-VS-LON-DAY-KHOEN',
      stageName: 'VS lộn dây khoen',
      description: 'VS lộn dây khoen',
      ssv: 10,
    },
    {
      stageCode: 'GD-VS-MAY-LON-DAY-KHOEN-LUNG',
      stageName: 'VS may lộn dây khoen lưng',
      description: 'VS may lộn dây khoen lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-DAY-KHOEN',
      stageName: 'Ủi dây khoen',
      description: 'Ủi dây khoen',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-DAY-KHOEN-LUNG',
      stageName: 'Ủi dây khoen lưng',
      description: 'Ủi dây khoen lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-DINH-LUNG-VAO-THUN',
      stageName: 'Đính lưng vào thun',
      description: 'Đính lưng vào thun',
      ssv: 10,
    },
    {
      stageCode: 'GD-THUA-KHUY-DAU-LUNG',
      stageName: 'Thùa khuy đầu lưng',
      description: 'Thùa khuy đầu lưng',
      ssv: 10,
    },
    {
      stageCode: 'GD-DUC-LO',
      stageName: 'Đục lỗ',
      description: 'Đục lỗ',
      ssv: 10,
    },
    {
      stageCode: 'GD-LD-NUT',
      stageName: 'LD nút (làm dấu nút)',
      description: 'LD nút (làm dấu nút)',
      ssv: 10,
    },
    {
      stageCode: 'GD-DONG-NUT-X1-X2-NUT-PAT',
      stageName: 'Đóng nút (X1, X2, nút pat)',
      description: 'Đóng nút (X1, X2, nút pat)',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-KEO-THAN-TUI',
      stageName: 'Ủi keo thân túi',
      description: 'Ủi keo thân túi',
      ssv: 10,
    },
    {
      stageCode: 'GD-UI-NEP-TUI',
      stageName: 'Ủi nẹp túi',
      description: 'Ủi nẹp túi',
      ssv: 10,
    },
    {
      stageCode: 'GD-XO-THAT-DAY-EO',
      stageName: 'Xỏ thắt dây eo',
      description: 'Xỏ thắt dây eo',
      ssv: 10,
    },
    {
      stageCode: 'GD-BAN-DAN-DAY-EO',
      stageName: 'Bắn đạn dây eo',
      description: 'Bắn đạn dây eo',
      ssv: 10,
    },
    {
      stageCode: 'GD-CHAY-VIEN-DAY-EO',
      stageName: 'Chạy viền dây eo',
      description: 'Chạy viền dây eo',
      ssv: 10,
    },
    {
      stageCode: 'GD-LUON-DAY-QUA-CHUONG',
      stageName: 'Luồn dây qua chuông',
      description: 'Luồn dây qua chuông',
      ssv: 10,
    },
    {
      stageCode: 'GD-BE-DINH-DAU-DAY',
      stageName: 'Bẻ đính đầu dây',
      description: 'Bẻ đính đầu dây',
      ssv: 10,
    },
  ];

  for (const s of stagesData) {
    const exists = await stageRepo.findOne({
      where: { stageCode: s.stageCode },
    });
    if (!exists) {
      await stageRepo.save(
        stageRepo.create({ ...s, status: StageStatus.ACTIVE }),
      );
    }
  }
  console.log(`  → ${stagesData.length} stages seeded`);

  // ─── Stage Groups ─────────────────────────────────────────────────────────────
  console.log('🌱 Seeding stage groups...');
  const stageGroupRepo = AppDataSource.getRepository(StageGroup);
  const stageGroupItemRepo = AppDataSource.getRepository(StageGroupItem);
  const stageGroupsData = [
    {
      groupCode: 'NS-1K',
      groupName: 'NS% 1K',
      description: 'Nhóm công đoạn NS% 1K',
      items: [
        'May lưng HC',
        'May lưng + may thu + mí',
        'May lưng HC + dây khoen',
        'May túi sau HC',
        'May túi dây keo',
        'May paget HC',
        'May lai',
        'Chít pen thân sau',
        'Diễu sóng TT',
        'Diễu sóng TT + patsan',
        'Diễu đáp túi xéo',
        'Diễu miệng túi trước',
        'Diễu paget',
        'Kẹp mí 1 li miệng túi trước',
        'Đóng túi vào thân',
        'Đóng túi vào thân + passant',
        'Khóa đáy',
        'Nối lưng',
        'Kẹp lưng',
        'Kẹp lưng + nối lưng',
        'Mí lưng',
        'Đính patsan',
        'Đính patsan + khoen',
        'Đính passant',
        'Đính passant (2 con x 4 điểm)',
        'Đính khoen',
        'Đính dây vào lưng',
        'Đính đầu lưng',
        'Nhãn sườn',
      ],
    },
    {
      groupCode: 'NS-VAT-SO',
      groupName: 'NS 1 vắt sổ',
      description: 'Nhóm công đoạn NS 1 vắt sổ',
      items: [
        'VS3C miệng túi trước',
        'VS3C lai',
        'VS3C đáp túi trước',
        'VS3C đáp túi sau',
        'VS3C đáp túi xéo',
        'VS3C lưng lót',
        'VS5C sườn',
        'VS5C tra lưng',
        'VS5C tra lưng + patsan',
        'VS5C tra lưng sau',
        'VS sườn',
        'VS sườn trong + đáy',
        'VS đáp túi xéo',
        'VS decup',
        'Vắt sổ sườn (VA sườn)',
        'VS lai',
        'VS3C DTS (định hình/đáp túi sau)',
        'VS3C trước',
      ],
    },
  ];

  for (const g of stageGroupsData) {
    let group = await stageGroupRepo.findOne({
      where: { groupCode: g.groupCode },
    });
    if (!group) {
      group = await stageGroupRepo.save(
        stageGroupRepo.create({
          groupCode: g.groupCode,
          groupName: g.groupName,
          description: g.description,
          status: StageGroupStatus.ACTIVE,
        }),
      );
      const items = g.items.map((name, idx) =>
        stageGroupItemRepo.create({
          groupId: group!.id,
          stageName: name,
          description: name,
          ssv: 10,
          orderIndex: idx,
        }),
      );
      await stageGroupItemRepo.save(items);
    }
  }
  console.log(`  → ${stageGroupsData.length} stage groups seeded`);

  // ─── Workshops ───────────────────────────────────────────────────────────────
  console.log('🌱 Seeding workshops...');
  const wsRepo = AppDataSource.getRepository(Workshop);
  const workshopsData = [
    {
      workshopCode: 'X-01',
      name: 'Xưởng May 1',
      manager: 'Nguyễn Văn A',
      location: 'Tầng 1 - Khu A',
      capacity: 500,
    },
    {
      workshopCode: 'X-02',
      name: 'Xưởng May 2',
      manager: 'Trần Thị B',
      location: 'Tầng 2 - Khu A',
      capacity: 450,
    },
    {
      workshopCode: 'X-03',
      name: 'Xưởng May 3 (Thể thao)',
      manager: 'Lê Văn C',
      location: 'Tầng 1 - Khu B',
      capacity: 600,
    },
    {
      workshopCode: 'X-04',
      name: 'Xưởng May 4 (Cao cấp)',
      manager: 'Phạm Thị D',
      location: 'Tầng 2 - Khu B',
      capacity: 300,
    },
    {
      workshopCode: 'X-05',
      name: 'Xưởng Cắt',
      manager: 'Hoàng Văn E',
      location: 'Tầng 3',
      capacity: 800,
    },
    {
      workshopCode: 'X-06',
      name: 'Xưởng Hoàn thiện',
      manager: 'Đỗ Thị F',
      location: 'Tầng 4',
      capacity: 700,
    },
    {
      workshopCode: 'X-07',
      name: 'Xưởng Dệt len',
      manager: 'Vũ Văn G',
      location: 'Khu C',
      capacity: 200,
    },
    {
      workshopCode: 'X-08',
      name: 'Xưởng Jean & Denim',
      manager: 'Bùi Thị H',
      location: 'Khu D',
      capacity: 400,
    },
  ];

  const savedWorkshops: Record<string, Workshop> = {};
  for (const w of workshopsData) {
    let ws = await wsRepo.findOne({ where: { workshopCode: w.workshopCode } });
    if (!ws) {
      ws = await wsRepo.save(
        wsRepo.create({ ...w, status: WorkshopStatus.ACTIVE }),
      );
    }
    savedWorkshops[w.workshopCode] = ws;
  }
  console.log(`  → ${workshopsData.length} workshops seeded`);

  // ─── Purchase Orders ─────────────────────────────────────────────────────────
  console.log('🌱 Seeding purchase orders...');
  const poRepo = AppDataSource.getRepository(PurchaseOrder);
  const poLogRepo = AppDataSource.getRepository(PoVersionLog);
  const lineRepo = AppDataSource.getRepository(PoLine);
  const colorRepo = AppDataSource.getRepository(LineColor);
  const sizeRepo = AppDataSource.getRepository(LineColorSize);
  const stepRepo = AppDataSource.getRepository(LineAs3bStep);
  const sampleRepo = AppDataSource.getRepository(LineSample);

  const posData = [
    {
      poCode: 'PO-2024-001',
      customerPoCode: 'KH-ABC-2024-001',
      customer: 'Brand ABC International',
      receivedDate: '2024-03-01',
      status: PoStatus.PO_FINAL,
      finalizedAt: new Date('2024-03-22'),
    },
    {
      poCode: 'PO-2024-002',
      customerPoCode: 'KH-FHV-2024-002',
      customer: 'Fashion House Vietnam',
      receivedDate: '2024-04-01',
      status: PoStatus.IN_PROGRESS,
    },
    {
      poCode: 'PO-2024-003',
      customerPoCode: 'KH-SSC-2024-001',
      customer: 'Sunrise Sport Co.',
      receivedDate: '2024-07-01',
      status: PoStatus.IN_PROGRESS,
    },
    {
      poCode: 'PO-2024-004',
      customerPoCode: 'KH-EFG-2024-003',
      customer: 'Elegance Fashion Group',
      receivedDate: '2024-09-15',
      status: PoStatus.CANCELLED,
    },
    {
      poCode: 'PO-2025-001',
      customerPoCode: 'KH-NOR-2025-Q1',
      customer: 'Nordic Apparel AS',
      receivedDate: '2025-01-10',
      status: PoStatus.PENDING_RD,
    },
    {
      poCode: 'PO-2025-002',
      customerPoCode: 'KH-PRG-2025-001',
      customer: 'Pacific Retail Group',
      receivedDate: '2025-03-01',
      status: PoStatus.IN_PROGRESS,
    },
    {
      poCode: 'PO-2025-003',
      customerPoCode: 'KH-TMV-2025-002',
      customer: 'TrendMark Vietnam',
      receivedDate: '2025-06-15',
      status: PoStatus.PENDING_RD,
    },
    {
      poCode: 'PO-2026-001',
      customerPoCode: 'KH-FHV-2026-001',
      customer: 'Fashion House Vietnam',
      receivedDate: '2026-01-10',
      status: PoStatus.IN_PROGRESS,
    },
    {
      poCode: 'PO-2026-002',
      customerPoCode: 'KH-SSC-2026-001',
      customer: 'Sunrise Sport Co.',
      receivedDate: '2026-02-15',
      status: PoStatus.PENDING_RD,
    },
    {
      poCode: 'PO-2026-003',
      customerPoCode: 'KH-ABC-2026-Q1',
      customer: 'Brand ABC International',
      receivedDate: '2026-03-20',
      status: PoStatus.DRAFT,
    },
  ];

  const savedPos: Record<string, PurchaseOrder> = {};
  for (const p of posData) {
    let po = await poRepo.findOne({ where: { poCode: p.poCode } });
    if (!po) {
      po = await poRepo.save(
        poRepo.create({ ...p, createdById: savedUsers[UserRole.TPKH]?.id }),
      );
      // Seed PO_CREATED log
      await poLogRepo.save(
        poLogRepo.create({
          poId: po.id,
          actor: 'tpkh@erp.local',
          eventType: PoEventType.PO_CREATED,
          reason: `Tiếp nhận PO từ ${p.customer}`,
        }),
      );
    }
    savedPos[p.poCode] = po;
  }
  console.log(`  → ${posData.length} purchase orders seeded`);

  // ─── Helper: createLine ───────────────────────────────────────────────────────
  async function createLine(
    poId: string,
    data: {
      styleCode: string;
      productName: string;
      category: LineCategory;
      material: string;
      deadline: string;
      status: LineStatus;
      colors: Array<{ name: string; sizes: Record<string, number> }>;
      as3bSteps?: Array<{
        stepName: string;
        description: string;
        timePerPc: number;
        ssv: number;
        orderIndex: number;
      }>;
    },
  ) {
    const existing = await lineRepo.findOne({
      where: { poId, styleCode: data.styleCode },
    });
    if (existing) return existing;

    const line = await lineRepo.save(
      lineRepo.create({
        poId,
        styleCode: data.styleCode,
        productName: data.productName,
        category: data.category,
        material: data.material,
        deadline: data.deadline,
        status: data.status,
      }),
    );

    for (const c of data.colors) {
      const color = await colorRepo.save(
        colorRepo.create({ lineId: line.id, colorName: c.name }),
      );
      for (const [sizeLabel, quantity] of Object.entries(c.sizes)) {
        await sizeRepo.save(
          sizeRepo.create({ colorId: color.id, sizeLabel, quantity }),
        );
      }
    }

    if (data.as3bSteps) {
      for (const step of data.as3bSteps) {
        await stepRepo.save(stepRepo.create({ lineId: line.id, ...step }));
      }
    }

    return line;
  }

  // ─── PO-2024-001 Lines ────────────────────────────────────────────────────────
  console.log('🌱 Seeding PO lines...');
  const po001 = savedPos['PO-2024-001'];
  const l4 = await createLine(po001.id, {
    styleCode: 'X001',
    productName: 'Áo jacket nam',
    category: LineCategory.JACKET,
    material: 'Polyester 100%',
    deadline: '2024-03-15',
    status: LineStatus.FINAL,
    colors: [{ name: 'Đen', sizes: { S: 50, M: 100, L: 80, XL: 40 } }],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 8,
        ssv: 0.133,
        orderIndex: 0,
      },
      {
        stepName: 'May thân trước',
        description: 'May các chi tiết',
        timePerPc: 15,
        ssv: 0.25,
        orderIndex: 1,
      },
      {
        stepName: 'May tay áo',
        description: 'Ráp tay áo',
        timePerPc: 12,
        ssv: 0.2,
        orderIndex: 2,
      },
    ],
  });
  const l5 = await createLine(po001.id, {
    styleCode: 'X002',
    productName: 'Quần short thể thao',
    category: LineCategory.SHORTS,
    material: 'Nylon 100%',
    deadline: '2024-03-20',
    status: LineStatus.FINAL,
    colors: [{ name: 'Xám', sizes: { S: 200, M: 300, L: 250 } }],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 5,
        ssv: 0.083,
        orderIndex: 0,
      },
      {
        stepName: 'May đũng',
        description: 'May đũng',
        timePerPc: 8,
        ssv: 0.133,
        orderIndex: 1,
      },
      {
        stepName: 'May cạp',
        description: 'May cạp quần',
        timePerPc: 6,
        ssv: 0.1,
        orderIndex: 2,
      },
    ],
  });

  // ─── PO-2024-002 Lines ────────────────────────────────────────────────────────
  const po002 = savedPos['PO-2024-002'];
  const l1 = await createLine(po002.id, {
    styleCode: 'A123',
    productName: 'Áo sơ mi nam tay dài',
    category: LineCategory.SHIRT,
    material: 'Cotton 100%',
    deadline: '2024-06-30',
    status: LineStatus.FINAL,
    colors: [{ name: 'Trắng', sizes: { S: 120, M: 200, L: 180, XL: 80 } }],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 5,
        ssv: 0.083,
        orderIndex: 0,
      },
      {
        stepName: 'Ráp vai',
        description: 'Ráp vai trước - sau',
        timePerPc: 8,
        ssv: 0.133,
        orderIndex: 1,
      },
      {
        stepName: 'Gắn tay áo',
        description: 'Ráp tay vào thân',
        timePerPc: 10,
        ssv: 10,
        orderIndex: 2,
      },
      {
        stepName: 'May cổ',
        description: 'Gắn cổ áo',
        timePerPc: 12,
        ssv: 0.2,
        orderIndex: 3,
      },
      {
        stepName: 'Viền gấu',
        description: 'Viền gấu áo',
        timePerPc: 6,
        ssv: 0.1,
        orderIndex: 4,
      },
      {
        stepName: 'Đính nút',
        description: 'Đính nút 5 hạt',
        timePerPc: 7,
        ssv: 0.117,
        orderIndex: 5,
      },
      {
        stepName: 'KCS nội bộ',
        description: 'Kiểm tra trước đóng gói',
        timePerPc: 3,
        ssv: 0.05,
        orderIndex: 6,
      },
    ],
  });

  // Seed samples for l1/A123
  const sp1 = await sampleRepo.findOne({ where: { lineId: l1.id, round: 1 } });
  if (!sp1) {
    await sampleRepo.save(
      sampleRepo.create({
        lineId: l1.id,
        round: 1,
        sampleDate: '2024-04-15',
        feedback:
          'Khách yêu cầu chỉnh cổ áo cao thêm 0.5cm. Đường may sườn cần đều hơn.',
        status: SampleStatus.CAN_CHINH_SUA,
      }),
    );
    await sampleRepo.save(
      sampleRepo.create({
        lineId: l1.id,
        round: 2,
        sampleDate: '2024-04-25',
        feedback: 'Khách đã đồng ý toàn bộ thông số. OK to produce.',
        status: SampleStatus.DA_DUYET,
      }),
    );
  }

  const l2 = await createLine(po002.id, {
    styleCode: 'B456',
    productName: 'Quần tây nam',
    category: LineCategory.PANTS,
    material: 'Polyester blend',
    deadline: '2024-07-15',
    status: LineStatus.SAMPLING,
    colors: [
      {
        name: 'Đen',
        sizes: { '28': 100, '30': 150, '32': 200, '34': 120, '36': 50 },
      },
    ],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 6,
        ssv: 0.1,
        orderIndex: 0,
      },
      {
        stepName: 'May đũng',
        description: 'May đũng quần trước - sau',
        timePerPc: 10,
        ssv: 10,
        orderIndex: 1,
      },
      {
        stepName: 'Ráp ống quần',
        description: 'Ráp 2 ống quần',
        timePerPc: 8,
        ssv: 0.133,
        orderIndex: 2,
      },
    ],
  });

  const l3 = await createLine(po002.id, {
    styleCode: 'C789',
    productName: 'Áo polo nữ',
    category: LineCategory.POLO,
    material: 'Pique cotton 220gsm',
    deadline: '2024-07-30',
    status: LineStatus.IN_REVIEW,
    colors: [{ name: 'Xanh navy', sizes: { S: 200, M: 300, L: 200 } }],
    as3bSteps: [],
  });

  // ─── PO-2024-003 Lines ────────────────────────────────────────────────────────
  const po003 = savedPos['PO-2024-003'];
  const l6 = await createLine(po003.id, {
    styleCode: 'D101',
    productName: 'Áo thể thao nam không tay',
    category: LineCategory.SHIRT,
    material: 'Polyester dri-fit 150gsm',
    deadline: '2024-09-15',
    status: LineStatus.FINAL,
    colors: [
      { name: 'Đỏ', sizes: { S: 150, M: 250, L: 200, XL: 100 } },
      { name: 'Xanh dương', sizes: { S: 120, M: 200, L: 180, XL: 80 } },
    ],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 4,
        ssv: 0.067,
        orderIndex: 0,
      },
      {
        stepName: 'May thân',
        description: 'May nối thân',
        timePerPc: 6,
        ssv: 0.1,
        orderIndex: 1,
      },
      {
        stepName: 'Ráp vai',
        description: 'Nối vai',
        timePerPc: 5,
        ssv: 0.083,
        orderIndex: 2,
      },
    ],
  });

  const l7 = await createLine(po003.id, {
    styleCode: 'D102',
    productName: 'Áo polo thể thao unisex',
    category: LineCategory.POLO,
    material: 'Pique polyester 200gsm',
    deadline: '2024-09-30',
    status: LineStatus.SAMPLING,
    colors: [
      { name: 'Đen', sizes: { S: 80, M: 160, L: 140, XL: 60, XXL: 30 } },
      { name: 'Trắng', sizes: { S: 80, M: 160, L: 140, XL: 60, XXL: 30 } },
    ],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập',
        timePerPc: 5,
        ssv: 0.083,
        orderIndex: 0,
      },
      {
        stepName: 'May cổ polo',
        description: 'Gắn cổ polo',
        timePerPc: 10,
        ssv: 10,
        orderIndex: 1,
      },
    ],
  });

  // ─── PO-2026-001 Lines (Active) ──────────────────────────────────────────────
  const po2026_001 = savedPos['PO-2026-001'];
  const lActive1 = await createLine(po2026_001.id, {
    styleCode: 'F101',
    productName: 'Áo sơ mi nam slim fit',
    category: LineCategory.SHIRT,
    material: 'Cotton 95% Polyester 5%',
    deadline: '2026-05-30',
    status: LineStatus.IN_REVIEW,
    colors: [
      { name: 'Trắng', sizes: { S: 200, M: 350, L: 300, XL: 150, XXL: 80 } },
      {
        name: 'Xanh nhạt',
        sizes: { S: 150, M: 280, L: 250, XL: 120, XXL: 60 },
      },
    ],
    as3bSteps: [
      {
        stepName: 'Cắt vải',
        description: 'Cắt theo rập slim fit',
        timePerPc: 5,
        ssv: 0.083,
        orderIndex: 0,
      },
      {
        stepName: 'May thân',
        description: 'May thân trước + túi',
        timePerPc: 10,
        ssv: 10,
        orderIndex: 1,
      },
      {
        stepName: 'May tay',
        description: 'May + gắn tay áo',
        timePerPc: 12,
        ssv: 0.2,
        orderIndex: 2,
      },
      {
        stepName: 'May cổ',
        description: 'May cổ áo',
        timePerPc: 12,
        ssv: 0.2,
        orderIndex: 3,
      },
      {
        stepName: 'Đính nút',
        description: 'Đính nút và khuyết',
        timePerPc: 6,
        ssv: 0.1,
        orderIndex: 4,
      },
    ],
  });

  const lActive2 = await createLine(po2026_001.id, {
    styleCode: 'F102',
    productName: 'Quần tây slim fit',
    category: LineCategory.PANTS,
    material: 'Wool blend 55/45',
    deadline: '2026-06-15',
    status: LineStatus.DRAFT,
    colors: [
      {
        name: 'Đen',
        sizes: { '30': 100, '32': 200, '34': 250, '36': 180, '38': 100 },
      },
    ],
    as3bSteps: [],
  });

  console.log('  → PO lines seeded');

  // ─── BOMs ─────────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding BOMs...');
  const bomRepo = AppDataSource.getRepository(Bom);
  const bomLineRepo = AppDataSource.getRepository(BomLine);

  const bomsData = [
    {
      poId: po002.id,
      lineId: l1.id,
      colorName: 'Trắng',
      styleCode: 'A123',
      productName: 'Áo sơ mi nam tay dài',
      poQuantity: 580,
      version: 1,
      status: BomStatus.APPROVED,
      deadline: '2024-05-31',
      totalCostPerUnit: 125000,
      lines: [
        {
          materialCode: 'VT-001',
          consumptionPerUnit: 1.5,
          yieldPct: 15,
          unitCost: 85000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-002',
          consumptionPerUnit: 5,
          yieldPct: 2,
          unitCost: 800,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
        {
          materialCode: 'NB-002',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 1200,
        },
      ],
    },
    {
      poId: po003.id,
      lineId: l6.id,
      colorName: 'Đỏ',
      styleCode: 'D101',
      productName: 'Áo thể thao nam không tay',
      poQuantity: 700,
      version: 1,
      status: BomStatus.APPROVED,
      deadline: '2024-08-31',
      totalCostPerUnit: 98000,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.8,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.08,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-005',
          consumptionPerUnit: 0.3,
          yieldPct: 8,
          unitCost: 12000,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
        {
          materialCode: 'NB-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 3800,
        },
      ],
    },
    {
      poId: po2026_001.id,
      lineId: lActive1.id,
      colorName: 'Trắng',
      styleCode: 'F101',
      productName: 'Áo sơ mi nam slim fit',
      poQuantity: 1080,
      version: 1,
      status: BomStatus.WAIT_SA_APPROVE,
      deadline: '2026-04-30',
      totalCostPerUnit: 0, // computed
      lines: [
        {
          materialCode: 'VT-001',
          consumptionPerUnit: 1.6,
          yieldPct: 12,
          unitCost: 85000,
        },
        {
          materialCode: 'PL-004',
          consumptionPerUnit: 0.2,
          yieldPct: 5,
          unitCost: 15000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-002',
          consumptionPerUnit: 7,
          yieldPct: 2,
          unitCost: 800,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
        {
          materialCode: 'NB-002',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 1200,
        },
        {
          materialCode: 'NB-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 3800,
        },
      ],
    },
  ];

  bomsData.push(
    {
      poId: po002.id,
      lineId: l2.id,
      colorName: 'Đen',
      styleCode: 'B456',
      productName: 'Quần tây nam',
      poQuantity: 620,
      version: 1,
      status: BomStatus.WAIT_TP_APPROVE,
      deadline: '2024-06-20',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-009',
          consumptionPerUnit: 1.18,
          yieldPct: 10,
          unitCost: 135000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.12,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 5500,
        },
        {
          materialCode: 'NB-002',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 1200,
        },
      ],
    },
    {
      poId: po002.id,
      lineId: l3.id,
      colorName: 'Xanh navy',
      styleCode: 'C789',
      productName: 'Áo polo nữ',
      poQuantity: 700,
      version: 1,
      status: BomStatus.WAIT_RD,
      deadline: '2024-07-10',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.82,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.09,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-005',
          consumptionPerUnit: 0.32,
          yieldPct: 8,
          unitCost: 12000,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
      ],
    },
    {
      poId: po001.id,
      lineId: l4.id,
      colorName: 'Đen',
      styleCode: 'X001',
      productName: 'Áo jacket nam',
      poQuantity: 270,
      version: 1,
      status: BomStatus.APPROVED,
      deadline: '2024-03-10',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.9,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-005',
          consumptionPerUnit: 0.3,
          yieldPct: 8,
          unitCost: 12000,
        },
      ],
    },
    {
      poId: po001.id,
      lineId: l5.id,
      colorName: 'Xám',
      styleCode: 'X002',
      productName: 'Quần short thể thao',
      poQuantity: 750,
      version: 1,
      status: BomStatus.APPROVED,
      deadline: '2024-03-12',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-009',
          consumptionPerUnit: 0.88,
          yieldPct: 10,
          unitCost: 135000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'NB-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 3800,
        },
      ],
    },
    {
      poId: po003.id,
      lineId: l6.id,
      colorName: 'Xanh dương',
      styleCode: 'D101',
      productName: 'Áo thể thao nam không tay',
      poQuantity: 580,
      version: 1,
      status: BomStatus.WAIT_SA_APPROVE,
      deadline: '2024-09-01',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.84,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.09,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
      ],
    },
    {
      poId: po003.id,
      lineId: l7.id,
      colorName: 'Đen',
      styleCode: 'D102',
      productName: 'Áo polo thể thao unisex',
      poQuantity: 470,
      version: 1,
      status: BomStatus.WAIT_PRICE,
      deadline: '2024-09-20',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.92,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-002',
          consumptionPerUnit: 3,
          yieldPct: 2,
          unitCost: 800,
        },
      ],
    },
    {
      poId: po003.id,
      lineId: l7.id,
      colorName: 'Trắng',
      styleCode: 'D102',
      productName: 'Áo polo thể thao unisex',
      poQuantity: 470,
      version: 2,
      status: BomStatus.APPROVED,
      deadline: '2024-09-22',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.9,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'NB-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 3800,
        },
      ],
    },
    {
      poId: po2026_001.id,
      lineId: lActive1.id,
      colorName: 'Xanh nhạt',
      styleCode: 'F101',
      productName: 'Áo sơ mi nam slim fit',
      poQuantity: 860,
      version: 1,
      status: BomStatus.WAIT_TP_APPROVE,
      deadline: '2026-05-03',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-001',
          consumptionPerUnit: 1.5,
          yieldPct: 12,
          unitCost: 85000,
        },
        {
          materialCode: 'PL-004',
          consumptionPerUnit: 0.2,
          yieldPct: 5,
          unitCost: 15000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
      ],
    },
    {
      poId: po2026_001.id,
      lineId: lActive2.id,
      colorName: 'Đen',
      styleCode: 'F102',
      productName: 'Quần tây slim fit',
      poQuantity: 830,
      version: 1,
      status: BomStatus.DRAFT,
      deadline: '2026-05-10',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-009',
          consumptionPerUnit: 1.22,
          yieldPct: 10,
          unitCost: 135000,
        },
        {
          materialCode: 'PL-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 5500,
        },
        {
          materialCode: 'NB-002',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 1200,
        },
      ],
    },
    {
      poId: po2026_001.id,
      lineId: lActive2.id,
      colorName: 'Đen',
      styleCode: 'F102',
      productName: 'Quần tây slim fit',
      poQuantity: 830,
      version: 2,
      status: BomStatus.WAIT_RD,
      deadline: '2026-05-14',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-009',
          consumptionPerUnit: 1.2,
          yieldPct: 10,
          unitCost: 135000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.12,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-003',
          consumptionPerUnit: 1,
          yieldPct: 3,
          unitCost: 5500,
        },
      ],
    },
    {
      poId: po003.id,
      lineId: l7.id,
      colorName: 'Đen',
      styleCode: 'D102',
      productName: 'Áo polo thể thao unisex',
      poQuantity: 470,
      version: 3,
      status: BomStatus.WAIT_SA_APPROVE,
      deadline: '2024-09-25',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-004',
          consumptionPerUnit: 0.95,
          yieldPct: 8,
          unitCost: 110000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'NB-001',
          consumptionPerUnit: 1,
          yieldPct: 2,
          unitCost: 2500,
        },
      ],
    },
    {
      poId: po002.id,
      lineId: l1.id,
      colorName: 'Trắng',
      styleCode: 'A123',
      productName: 'Áo sơ mi nam tay dài',
      poQuantity: 580,
      version: 2,
      status: BomStatus.LOCKED,
      deadline: '2024-06-01',
      totalCostPerUnit: 0,
      lines: [
        {
          materialCode: 'VT-001',
          consumptionPerUnit: 1.4,
          yieldPct: 12,
          unitCost: 85000,
        },
        {
          materialCode: 'PL-001',
          consumptionPerUnit: 0.1,
          yieldPct: 5,
          unitCost: 18000,
        },
        {
          materialCode: 'PL-002',
          consumptionPerUnit: 5,
          yieldPct: 2,
          unitCost: 800,
        },
      ],
    },
  );

  for (const b of bomsData) {
    const existingBom = await bomRepo.findOne({
      where: { lineId: b.lineId, colorName: b.colorName, version: b.version },
    });
    if (existingBom) continue;

    const bomCreate = new Bom();
    bomCreate.poId = b.poId;
    bomCreate.lineId = b.lineId;
    bomCreate.colorName = b.colorName;
    bomCreate.styleCode = b.styleCode;
    bomCreate.productName = b.productName;
    bomCreate.poQuantity = b.poQuantity;
    bomCreate.version = b.version;
    bomCreate.status = b.status;
    bomCreate.deadline = b.deadline;
    if (savedUsers[UserRole.RD])
      bomCreate.submittedById = savedUsers[UserRole.RD].id;
    if (b.status === BomStatus.APPROVED) {
      if (savedUsers[UserRole.SA])
        bomCreate.approvedById = savedUsers[UserRole.SA].id;
      bomCreate.approvedAt = new Date();
    }
    const bom = await bomRepo.save(bomCreate);

    let total = 0;
    for (const line of b.lines) {
      const mat = savedMaterials[line.materialCode];
      const lineCost = line.unitCost * (1 + line.yieldPct / 100);
      total += lineCost;
      await bomLineRepo.save(
        bomLineRepo.create({
          bomId: bom.id,
          masterMaterialId: mat?.id,
          materialName: mat?.materialName ?? line.materialCode,
          materialGroup: (mat as any)?.materialGroupEntity?.name ?? 'FUSIBLE',
          unit: mat?.unit ?? 'Cái',
          yieldPct: line.yieldPct,
          unitCost: line.unitCost,
          lineCostPerUnit: lineCost,
        }),
      );
    }

    await bomRepo.update(bom.id, { totalCostPerUnit: total });
  }
  console.log(`  → ${bomsData.length} BOMs seeded`);

  // ─── Production Plans ────────────────────────────────────────────────────────
  console.log('🌱 Seeding production plans...');
  const planRepo = AppDataSource.getRepository(ProductionPlan);
  const dailyRepo = AppDataSource.getRepository(DailyPlan);

  const plansData = [
    // PO-2024-001 plans
    {
      lineId: l4.id,
      workshopCode: 'X-01',
      month: 3,
      year: 2024,
      plannedQuantity: 270,
      dailyQty: 30,
    },
    {
      lineId: l5.id,
      workshopCode: 'X-03',
      month: 3,
      year: 2024,
      plannedQuantity: 750,
      dailyQty: 80,
    },
    // PO-2024-002 plans
    {
      lineId: l1.id,
      workshopCode: 'X-01',
      month: 6,
      year: 2024,
      plannedQuantity: 580,
      dailyQty: 60,
    },
    {
      lineId: l2.id,
      workshopCode: 'X-02',
      month: 7,
      year: 2024,
      plannedQuantity: 620,
      dailyQty: 65,
    },
    // PO-2024-003 plans
    {
      lineId: l6.id,
      workshopCode: 'X-03',
      month: 9,
      year: 2024,
      plannedQuantity: 1280,
      dailyQty: 100,
    },
    {
      lineId: l7.id,
      workshopCode: 'X-03',
      month: 9,
      year: 2024,
      plannedQuantity: 940,
      dailyQty: 90,
    },
    // PO-2026-001 plans
    {
      lineId: lActive1.id,
      workshopCode: 'X-01',
      month: 5,
      year: 2026,
      plannedQuantity: 1080,
      dailyQty: 80,
    },
    {
      lineId: lActive2.id,
      workshopCode: 'X-02',
      month: 6,
      year: 2026,
      plannedQuantity: 830,
      dailyQty: 70,
    },
  ];

  for (const p of plansData) {
    const ws = savedWorkshops[p.workshopCode];
    const exists = await planRepo.findOne({
      where: { lineId: p.lineId, month: p.month, year: p.year },
    });
    if (exists) continue;

    const plan = await planRepo.save(
      planRepo.create({
        lineId: p.lineId,
        workshopId: ws?.id,
        month: p.month,
        year: p.year,
        plannedQuantity: p.plannedQuantity,
        createdById: savedUsers[UserRole.TPKH]?.id,
      }),
    );

    // Seed 10 days of daily plans
    const daysInMonth = new Date(p.year, p.month, 0).getDate();
    const step = Math.floor(daysInMonth / 10);
    for (let i = 0; i < 10; i++) {
      const day = Math.min((i + 1) * step, daysInMonth);
      await dailyRepo.save(
        dailyRepo.create({
          planId: plan.id,
          day,
          plannedQty: p.dailyQty,
          actualQty: p.year < 2026 ? Math.floor(p.dailyQty * 0.95) : 0,
        }),
      );
    }
  }
  console.log(`  → ${plansData.length} production plans seeded`);

  await AppDataSource.destroy();
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Users: ${users.length}`);
  console.log(`  Materials: ${materialsData.length}`);
  console.log(`  Stages: ${stagesData.length}`);
  console.log(`  Workshops: ${workshopsData.length}`);
  console.log(`  Purchase Orders: ${posData.length}`);
  console.log(`  BOMs: ${bomsData.length}`);
  console.log(`  Production Plans: ${plansData.length}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
