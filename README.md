# ERP Backend — NestJS

Backend được xây dựng bằng **NestJS** + **TypeORM** + **PostgreSQL**.

---

## Yêu cầu cài đặt

- [Node.js](https://nodejs.org/) >= 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — để chạy PostgreSQL

---

## Bắt đầu lần đầu (clone về xong làm theo thứ tự này)

### Bước 1 — Cài dependencies

```bash
npm install
```

### Bước 2 — Tạo file cấu hình

```bash
cp .env.example .env
```

Mở file `.env` vừa tạo, mặc định không cần chỉnh gì cả.

### Bước 3 — Khởi động Database bằng Docker

> Docker Desktop phải đang chạy trước khi làm bước này.  
> Mở Docker Desktop, chờ nó khởi động xong (icon dưới taskbar không còn loading).

```bash
npm run db:up
```

Lệnh này tự động tải PostgreSQL về và chạy. Lần đầu tải hơi lâu, chờ xong sẽ thấy:

```
Container erp_postgres  Started
```

Kiểm tra DB đã chạy chưa:

```bash
docker ps
```

Kết quả mong muốn — cột STATUS phải là `healthy`:

```
NAMES          STATUS                    PORTS
erp_postgres   Up 30 seconds (healthy)   0.0.0.0:5433->5432/tcp
```

### Bước 4 — Chạy backend

```bash
npm run start:dev
```

API chạy tại: `http://localhost:8002/api/v1`

---

## Quản lý Docker hàng ngày

| Lệnh | Khi nào dùng |
|------|-------------|
| `npm run db:up` | Mở máy lên, muốn chạy backend |
| `npm run db:down` | Tắt máy hoặc không cần DB nữa (data vẫn còn) |
| `npm run db:reset` | Muốn xóa toàn bộ data, tạo DB trắng từ đầu |

> **Lưu ý:** Tắt máy mà không chạy `db:down` thì lần sau bật lại phải chạy `db:up` lại.

---

## Migration — Ghi lại thay đổi DB

> **Quy tắc bắt buộc:** Mọi thay đổi schema (thêm bảng, thêm cột, đổi kiểu dữ liệu...) đều phải tạo migration file và commit lên git cùng với code.  
> Không bao giờ chỉnh DB tay hoặc bật `synchronize: true`.

### Quy trình khi thay đổi DB

**Bước 1** — Sửa entity, ví dụ thêm cột `phone` vào User:

```ts
// src/features/user/entities/user.entity.ts
@Column({ nullable: true })
phone: string;
```

**Bước 2** — Generate migration (đặt tên mô tả thay đổi):

```bash
npm run migration:generate -- src/database/migrations/AddPhoneToUser
```

File mới sẽ tự động tạo trong `src/database/migrations/`, ví dụ:  
`1712345678901-AddPhoneToUser.ts`

**Bước 3** — Mở file migration vừa tạo, kiểm tra nội dung có đúng không

**Bước 4** — Commit cả entity lẫn migration vào git:

```bash
git add src/features/user/entities/user.entity.ts
git add src/database/migrations/1712345678901-AddPhoneToUser.ts
git commit -m "feat(user): add phone column"
```

> Migration sẽ tự chạy lên DB khi khởi động app (`npm run start:dev`).

### Các lệnh migration

| Lệnh | Mô tả |
|------|-------|
| `npm run migration:generate -- src/database/migrations/TenMoTa` | Tạo migration từ thay đổi entity |
| `npm run migration:run` | Chạy thủ công các migration chưa được áp dụng |
| `npm run migration:revert` | Rollback migration gần nhất |
| `npm run migration:show` | Xem danh sách migration và trạng thái |

---

## Cấu trúc thư mục

```
src/
├── app.module.ts
├── main.ts
├── database/
│   ├── database.module.ts         # Cấu hình kết nối DB
│   ├── data-source.ts             # Dùng cho lệnh migration CLI
│   └── migrations/                # Tất cả migration files — phải commit vào git
├── features/                      # Các module nghiệp vụ (user, product, ...)
└── common/                        # Guards, interceptors, decorators dùng chung
```
