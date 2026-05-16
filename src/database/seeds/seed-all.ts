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

  

  await AppDataSource.destroy();
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Users: ${users.length}`);
  console.log(`  Materials: ${materialsData.length}`);
  console.log(`  Stages: ${stagesData.length}`);
  console.log(`  Workshops: ${workshopsData.length}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
