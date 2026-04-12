# ERP Backend — NestJS

Backend ERP system được xây dựng bằng **NestJS** + **TypeORM** + **PostgreSQL**.

---

## Yêu cầu

- [Node.js](https://nodejs.org/) >= 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 1. Cài đặt lần đầu

```bash
# Cài dependencies
npm install

# Tạo file cấu hình môi trường
cp .env.example .env
```

> Mở `.env` và chỉnh `DB_PASSWORD` nếu cần (mặc định là `postgres`).

---

## 2. Khởi động Database (PostgreSQL qua Docker)

```bash
npm run db:up
```

Lệnh này kéo image PostgreSQL 16 Alpine và khởi động container `erp_postgres` tại port **5433**.

Kiểm tra container đã chạy chưa:

```bash
docker ps
# erp_postgres   Up X seconds (healthy)   0.0.0.0:5433->5432/tcp
```

Các lệnh quản lý DB khác:

```bash
npm run db:down    # Tắt container (data vẫn còn)
npm run db:reset   # Xóa toàn bộ data và khởi động lại từ đầu
```

---

## 3. Chạy Backend

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

API chạy tại: `http://localhost:3000/api/v1`

---

## 4. Migration — Ghi lại mọi thay đổi DB

> **Quy tắc bắt buộc:** Mọi thay đổi schema đều phải có migration file đi kèm.
> Không bao giờ dùng `synchronize: true`.

### Quy trình khi thay đổi DB

**Bước 1** — Sửa hoặc tạo entity trong `src/features/<tên>/entities/*.entity.ts`

```ts
// Ví dụ: thêm column phone vào User entity
@Column({ nullable: true })
phone: string;
```

**Bước 2** — Generate migration (TypeORM tự so sánh entity với DB hiện tại)

```bash
npm run migration:generate -- src/database/migrations/AddPhoneToUser
```

File mới xuất hiện tại `src/database/migrations/`, ví dụ:
`1712345678901-AddPhoneToUser.ts`

**Bước 3** — Review file migration vừa tạo

```ts
// UP — thay đổi sẽ áp dụng lên DB
public async up(queryRunner: QueryRunner): Promise<void> { ... }

// DOWN — rollback nếu cần
public async down(queryRunner: QueryRunner): Promise<void> { ... }
```

**Bước 4** — Chạy migration

```bash
npm run migration:run
```

> Khi app khởi động bằng `npm run start:dev`, migration cũng tự chạy nhờ `migrationsRun: true`.

**Bước 5** — Commit cả entity lẫn migration vào git

```bash
git add src/features/user/entities/user.entity.ts
git add src/database/migrations/1712345678901-AddPhoneToUser.ts
git commit -m "feat(user): add phone column"
```

---

### Bảng lệnh migration

| Lệnh | Mô tả |
|------|-------|
| `npm run migration:generate -- src/database/migrations/TenMigration` | Tạo migration từ thay đổi entity |
| `npm run migration:run` | Chạy tất cả migration chưa áp dụng |
| `npm run migration:revert` | Rollback migration gần nhất |
| `npm run migration:show` | Xem danh sách và trạng thái migration |

---

## 5. Tạo Feature Module mới

```bash
npx nest g module features/ten-module
npx nest g controller features/ten-module
npx nest g service features/ten-module
```

Sau đó:
1. Tạo entity: `src/features/ten-module/entities/ten-module.entity.ts`
2. Generate migration: `npm run migration:generate -- src/database/migrations/CreateTenModule`
3. Chạy: `npm run migration:run`

---

## Cấu trúc thư mục

```
src/
├── app.module.ts                  # Root module
├── main.ts                        # Bootstrap (prefix, pipes, CORS)
├── database/
│   ├── database.module.ts         # TypeORM connection config
│   ├── data-source.ts             # DataSource cho migration CLI
│   └── migrations/                # Tất cả migration files (commit vào git)
├── features/                      # Các feature module (user, product, ...)
└── common/                        # Guards, interceptors, decorators dùng chung
```
