import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Stage, StageStatus } from '../../features/masters/entities/stage.entity';

config(); // Load .env file

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_demo',
  entities: [Stage],
  synchronize: false,
});

const stagesData = [
  // ─── Cutting & Preparation ────────────────────────────────────────────
  { stageCode: 'GD-CAT', stageName: 'Cắt vải', description: 'Cắt theo rập', smv: 0.083 },
  { stageCode: 'GD-KD-CAT', stageName: 'Kéo điện cắt', description: 'Cắt bằng máy kéo điện', smv: 0.067 },
  { stageCode: 'GD-CAT-LASER', stageName: 'Cắt laser', description: 'Cắt bằng máy laser', smv: 0.05 },
  { stageCode: 'GD-DAN-VAI', stageName: 'Dán vải', description: 'Dán lớp lót, lưới', smv: 0.1 },

  // ─── Sewing - Upper Body ───────────────────────────────────────────────
  { stageCode: 'GD-RAP-VAI', stageName: 'Ráp vai', description: 'Ráp vai trước - sau', smv: 0.133 },
  { stageCode: 'GD-GAN-TAY', stageName: 'Gắn tay áo', description: 'Ráp tay vào thân', smv: 0.167 },
  { stageCode: 'GD-MAY-CO', stageName: 'May cổ', description: 'Gắn cổ áo', smv: 0.2 },
  { stageCode: 'GD-MAY-CO-POLO', stageName: 'May cổ polo', description: 'Gắn cổ polo', smv: 0.167 },
  { stageCode: 'GD-VIEN-CO', stageName: 'Viền cổ', description: 'Viền cổ áo', smv: 0.067 },
  { stageCode: 'GD-VIEN-LO-TAY', stageName: 'Viền lỗ tay', description: 'Viền 2 lỗ tay áo', smv: 0.067 },
  { stageCode: 'GD-MAY-THAN', stageName: 'May thân', description: 'May thân áo/váy', smv: 0.333 },
  { stageCode: 'GD-MAY-THAN-T', stageName: 'May thân trước', description: 'May các chi tiết thân trước', smv: 0.25 },
  { stageCode: 'GD-MAY-THAN-S', stageName: 'May thân sau', description: 'May nối thân sau', smv: 0.25 },
  { stageCode: 'GD-LON-MONG', stageName: 'Lộn mông', description: 'Lộn phần mông quần', smv: 0.117 },
  { stageCode: 'GD-MAY-FERMATURE', stageName: 'May fermeture', description: 'Gắn khóa kéo', smv: 0.133 },

  // ─── Sewing - Lower Body ───────────────────────────────────────────────
  { stageCode: 'GD-MAY-DUNG', stageName: 'May đũng', description: 'May đũng quần trước - sau', smv: 0.167 },
  { stageCode: 'GD-RAP-ONG', stageName: 'Ráp ống quần', description: 'Ráp 2 ống quần', smv: 0.133 },
  { stageCode: 'GD-LON-ONG', stageName: 'Lộn ống quần', description: 'Viền gấu ống', smv: 0.117 },
  { stageCode: 'GD-MAY-CAP', stageName: 'May cạp', description: 'May cạp quần', smv: 0.1 },

  // ─── Accessories ──────────────────────────────────────────────────────
  { stageCode: 'GD-DINH-NUT', stageName: 'Đính nút', description: 'Đính nút', smv: 0.117 },
  { stageCode: 'GD-DINH-MOC', stageName: 'Đính móc/khóa', description: 'Gắn móc + khóa kéo', smv: 0.083 },
  { stageCode: 'GD-GAN-VIEN', stageName: 'Gắn viền', description: 'Gắn viền trang trí', smv: 0.1 },
  { stageCode: 'GD-MAY-VIEN', stageName: 'May viền', description: 'May viền đường may', smv: 0.083 },
  { stageCode: 'GD-DAN-KEO', stageName: 'Dán keo', description: 'Dán keo nhiệt', smv: 0.05 },

  // ─── Knitting ─────────────────────────────────────────────────────────
  { stageCode: 'GD-DET-THAN', stageName: 'Dệt thân áo', description: 'Dệt theo chương trình', smv: 0.75 },
  { stageCode: 'GD-DET-TAY', stageName: 'Dệt tay áo', description: 'Dệt 2 tay áo', smv: 0.5 },
  { stageCode: 'GD-DET-CO', stageName: 'Dệt cổ lọ', description: 'Dệt phần cổ lọ', smv: 0.25 },
  { stageCode: 'GD-RAP-AO', stageName: 'Ráp áo', description: 'Nối các phần lại với nhau', smv: 0.333 },

  // ─── Quality Control ──────────────────────────────────────────────────
  { stageCode: 'GD-KCS-NB', stageName: 'KCS nội bộ', description: 'Kiểm tra trước đóng gói', smv: 0.05 },
  { stageCode: 'GD-KCS-TC', stageName: 'KCS thành phẩm', description: 'Kiểm tra chất lượng cuối', smv: 0.067 },
  { stageCode: 'GD-UT-MAU', stageName: 'Ủ thử mẫu', description: 'Ủi là, kiểm tra form', smv: 0.083 },

  // ─── Finishing ───────────────────────────────────────────────────────
  { stageCode: 'GD-IN-LUNG', stageName: 'In logo lưng', description: 'In nhiệt logo thương hiệu', smv: 0.05 },
  { stageCode: 'GD-DONG-GOI', stageName: 'Đóng gói', description: 'Gấp, túi PE, thùng carton', smv: 0.067 },
  { stageCode: 'GD-GAN-TAG', stageName: 'Gắn tag', description: 'Gắn tag, nhãn mác', smv: 0.033 },
  { stageCode: 'GD-KHO-VAI', stageName: 'Khử запах', description: 'Khử mùi, ủi hơi nước', smv: 0.05 },
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
      await stageRepo.save(stageRepo.create({ ...s, status: StageStatus.ACTIVE }));
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
