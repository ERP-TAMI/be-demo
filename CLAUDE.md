# CLAUDE.md — ERP Backend (NestJS)

## Project Overview

Backend ERP system built with NestJS + TypeORM + PostgreSQL.

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: TypeORM — migrations bắt buộc, KHÔNG dùng synchronize
- **API Prefix**: `api/v1`
- **Port**: 3000 (default)

## Project Structure

```
src/
├── app.module.ts                  # Root module
├── main.ts                        # Entry point (global prefix, ValidationPipe, CORS)
├── database/
│   ├── database.module.ts         # TypeORM connection config
│   ├── data-source.ts             # DataSource cho TypeORM CLI (migration)
│   └── migrations/                # Tất cả migration files đặt ở đây
└── common/                        # Shared guards, interceptors, decorators
```

## Development Commands

```bash
# Khởi động PostgreSQL (Docker)
npm run db:up

# Tắt PostgreSQL
npm run db:down

# Reset DB (xóa volume, tạo lại)
npm run db:reset

# Start dev server (watch mode)
npm run start:dev

# Build production
npm run build

# Lint
npm run lint
```

## Migration Commands

> Mọi thay đổi schema DB đều phải qua migration — KHÔNG bao giờ dùng `synchronize: true`.

```bash
# Tạo migration từ thay đổi entity (thay MyMigrationName bằng tên mô tả)
npm run migration:generate -- src/database/migrations/MyMigrationName

# Chạy tất cả migration chưa chạy
npm run migration:run

# Rollback migration gần nhất
npm run migration:revert

# Xem trạng thái migration
npm run migration:show
```

**Quy trình khi thay đổi DB:**
1. Sửa entity (`*.entity.ts`)
2. Chạy `npm run migration:generate -- src/database/migrations/TenMoTa`
3. Review file migration vừa được tạo trong `src/database/migrations/`
4. Commit cả entity + migration file vào git

## Environment Variables

Copy `.env.example` thành `.env`.

| Variable       | Default       | Description                          |
|----------------|---------------|--------------------------------------|
| `PORT`         | `3000`        | HTTP port                            |
| `API_PREFIX`   | `api/v1`      | Global API prefix                    |
| `DB_HOST`      | `localhost`   | PostgreSQL host                      |
| `DB_PORT`      | `5433`        | PostgreSQL port (Docker mapped)      |
| `DB_USERNAME`  | `postgres`    | Database username                    |
| `DB_PASSWORD`  | `postgres`    | Database password                    |
| `DB_NAME`      | `erp_demo`    | Database name                        |
| `DB_SYNCHRONIZE` | `false`    | Luôn để false — dùng migration       |
| `NODE_ENV`     | `development` | Environment mode                     |

## Coding Conventions

- **Module structure**: Mỗi feature có module riêng (`src/features/<name>/`)
- **Entities**: Đặt tên `*.entity.ts`, trong folder feature tương ứng
- **DTOs**: Dùng `class-validator` decorators để validate
- **Services**: Toàn bộ business logic — controller chỉ nhận/trả HTTP
- **Global ValidationPipe**: Đã cấu hình `whitelist: true`, `transform: true`

## Creating a New Feature Module

```bash
npx nest g module features/my-feature
npx nest g controller features/my-feature
npx nest g service features/my-feature
```

Sau đó tạo entity: `src/features/my-feature/entities/my-feature.entity.ts`
Rồi generate migration: `npm run migration:generate -- src/database/migrations/CreateMyFeature`

## Key Packages

| Package              | Purpose                    |
|----------------------|----------------------------|
| `@nestjs/typeorm`    | TypeORM integration        |
| `typeorm`            | ORM                        |
| `pg`                 | PostgreSQL driver          |
| `@nestjs/config`     | `.env` configuration       |
| `class-validator`    | DTO validation decorators  |
| `class-transformer`  | Object transformation      |
