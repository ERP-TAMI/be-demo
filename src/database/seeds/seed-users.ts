import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import {
  User,
  UserRole,
  UserStatus,
} from '../../features/user/entities/user.entity.js';

config(); // load .env

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_demo',
  entities: [User],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Database connected for seeding...');

  const userRepo = AppDataSource.getRepository(User);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  const seedUsers = [
    {
      email: 'itadmin@erp.com',
      passwordHash,
      fullName: 'Quản trị viên IT',
      role: UserRole.IT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false, // Tài khoản dev/test — không ép đổi pass
      phone: undefined,
    },
    {
      email: 'tpkh@erp.com',
      passwordHash,
      fullName: 'Trần Minh Anh',
      role: UserRole.TPKH,
      status: UserStatus.ACTIVE,
      mustChangePassword: true, // Test luồng bắt buộc đổi mật khẩu
      phone: undefined,
    },
    {
      email: 'nvkh@erp.com',
      passwordHash,
      fullName: 'Lê Thị Huyền',
      role: UserRole.NVKH,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      phone: undefined,
    },
    {
      email: 'rd@erp.com',
      passwordHash,
      fullName: 'Nguyễn Quốc Đạt',
      role: UserRole.RD,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      phone: undefined,
    },
    {
      email: 'kt@erp.com',
      passwordHash,
      fullName: 'Phạm Thanh Hà',
      role: UserRole.KT,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      phone: undefined,
    },
    {
      email: 'sa@erp.com',
      passwordHash,
      fullName: 'Võ Gia Bảo',
      role: UserRole.SA,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      phone: undefined,
    },
  ];

  for (const userData of seedUsers) {
    const exists = await userRepo.findOne({ where: { email: userData.email } });
    if (exists) {
      console.log(`⏩ Skipped (already exists): ${userData.email}`);
      continue;
    }

    const user = userRepo.create(userData);
    await userRepo.save(user);
    console.log(`✅ Created: ${userData.email} (${userData.role})`);
  }

  console.log('\n🎉 Seed completed!');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
