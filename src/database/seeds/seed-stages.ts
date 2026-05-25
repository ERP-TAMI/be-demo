import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import {
  Stage,
  StageStatus,
} from '../../features/masters/entities/stage.entity';

config(); // Load .env file

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_demo',
  entities: [Stage],
  synchronize: false,
});

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

async function seedStages() {
  await AppDataSource.initialize();
  console.log('🔌 Database connected');

  const stageRepo = AppDataSource.getRepository(Stage);
  let created = 0;
  let skipped = 0;

  for (const s of stagesData) {
    const exists = await stageRepo.findOne({
      where: { stageCode: s.stageCode },
    });
    if (!exists) {
      await stageRepo.save(
        stageRepo.create({ ...s, status: StageStatus.ACTIVE }),
      );
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Stages seeded: ${created} created, ${skipped} skipped`);
  await AppDataSource.destroy();
}

seedStages().catch((err) => {
  console.error('❌ Seed stages failed:', err);
  process.exit(1);
});
