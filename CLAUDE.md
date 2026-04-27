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

---

## Git Conventions

### Branch naming
`feature/<TenNgan>_<TenChucNang>` — ví dụ: `feature/Nam_PO`, `feature/Thang_KeHoachSanXuat`

Branch luôn đi từ `main`, push lên remote tương ứng (`origin`), tạo PR khi xong.

### Commit message prefix
- `feat:` — tính năng mới
- `fix:` — bug fix
- `refactor:` — refactor không đổi behavior
- `chore:` — tooling, deps, config
- `docs:` — chỉ sửa docs/README/CLAUDE.md

Format:
```
feat: <tóm tắt 1 dòng — focus vào WHY hơn WHAT>

- gạch đầu dòng chi tiết (optional)
- ngôn ngữ tiếng Việt OK
```

KHÔNG dùng `--no-verify` để skip hook trừ khi user yêu cầu rõ ràng.

---

## Feature Modules Summary

### `auth/`
JWT authentication. `POST /auth/login` → `{ accessToken, user }`. Demo nên không có refresh token.

### `users/`
User CRUD. Field `mustChangePassword` để force đổi mật khẩu lần đầu (nhưng seed `seed-all.ts` set `false` cho test nhanh).

### `masters/`
Master data: `materials`, `suppliers`, `customers`, `colors`, `styles`, `master-pos`. Soft status (`active`/`inactive`). Material có `lastUnitCost` lưu giá gần nhất (chỉ tham khảo, không auto-fill BOM).

### `purchase-orders/`
PO lifecycle: `Draft → Pending_RD → In_Progress → PO_Final → Cancelled`.
- `po.entity.ts` — PO header
- `po-line.entity.ts` — PO line items (1 line = 1 style + color + size run)
- `po-version-log.entity.ts` — audit log event-based; `PoEventType` enum bao gồm cả `BOM_*` events (BOM dùng chung audit log với PO)

### `boms/`
**BOM = định mức NPL cho từng PO line.** Workflow đa vai trò:

```
Draft → Wait_RD → Wait_TP_Approve → Wait_Price → Wait_SA_Approve → Approved → Locked
```

| Stage | Actor | Hành động |
|---|---|---|
| `Draft` | NVKH/TPKH | Tạo BOM, nhập tên/nhóm/ĐVT vật tư |
| `Wait_RD` | R&D | Nhập `consumptionPerUnit` (định mức tiêu hao) |
| `Wait_TP_Approve` | TPKH | Review số lượng định mức |
| `Wait_Price` | KT | Nhập `unitCost` (đơn giá NPL) |
| `Wait_SA_Approve` | SA | Duyệt final |
| `Approved → Locked` | system | Auto |

**Cost formula (cố định 3% wastage):**
```
lineCostPerUnit = consumptionPerUnit × 1.03 × unitCost
totalCostPerUnit = SUM(lineCostPerUnit)  (recompute mọi lúc line thay đổi)
```

**Files:**
- `boms.service.ts` — toàn bộ business logic
  - `validTransitions` — bảng cho phép/cấm transition giữa các status
  - `assertTransitionDataReady` — check data đủ trước khi chuyển status (R&D phải có consumption > 0, KT phải có unitCost > 0, ...)
  - `assertEditableBomForLineChange` — chỉ `Draft`/`Wait_RD`/`Wait_Price` được sửa lines
  - `recomputeTotal` — chạy sau mọi line CRUD
  - `writeBomLog` — helper ghi audit log với `BOM_*` event types
- `entities/bom.entity.ts` — header (styleId, masterPoId, version, status, approvedBy, totalCostPerUnit, ...)
- `entities/bom-line.entity.ts` — line (consumptionPerUnit DECIMAL(10,4), unitCost DECIMAL(15,2), lineCostPerUnit, createdAt cho stable ordering)

**Visibility rules (FE enforce):**
- `consumptionPerUnit` (định mức): mọi role đều thấy
- `unitCost`, `lineCostPerUnit`, `SL cần mua`, totals: chỉ KT/SA

---

## Database Seeding

```bash
npm run db:reset && npm run migration:run && npm run seed
```

`seed-all.ts` tạo: 6 users + sample masters + sample POs + BOMs demo. Tài khoản test (password `Admin@123`):

| Email | Role |
|---|---|
| `admin@erp.local` | Admin |
| `sa@erp.local` | Giám đốc (duyệt cuối) |
| `tpkh@erp.local` | TP Kế hoạch |
| `nvkh@erp.local` | NV Kế hoạch |
| `rd@erp.local` | R&D |
| `kt@erp.local` | Kế toán |
