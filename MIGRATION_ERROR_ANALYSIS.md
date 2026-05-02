# Migration - Lỗi hay gặp và cách tránh

## Tóm tắt nhanh

Migration = file SQL để thay đổi database schema theo thứ tự. TypeORM chạy chúng **tuần tự theo timestamp** trong tên file.

---

## Lỗi 1: Migration sinh ra trên DB "cá nhân" → commit lên main → lỗi

**Nguyên nhân:**

Bạn chạy `migration:generate` khi DB của bạn đang có các table mà main chưa có.
TypeORM so sánh entity với DB **của bạn** → sinh ra migration có `DROP CONSTRAINT` từ các table chưa tồn tại trên main.

**Ví dụ:**

```
DB của bạn: có line_color_cards
DB của main: chưa có line_color_cards

migration:generate sinh ra:
→ ALTER TABLE "line_color_cards" DROP CONSTRAINT "FK_..." ← main không có table này
→ Chạy trên main: ❌ "relation does not exist"
```

**Cách tránh:**

Trước khi `migration:generate`, luôn reset DB về trạng thái của main:

```bash
git pull origin main
npm run db:reset
npm run migration:run
# Bây giờ DB của bạn = DB của main → generate an toàn
npm run migration:generate -- src/database/migrations/TenFeature
```

---

## Lỗi 2: Hai migration trùng timestamp

Nếu 2 file có cùng timestamp (vd: `1777500000000`) → TypeORM bị confused, không biết chạy cái nào trước.

**Cách tránh:** Đặt tên tự nhiên bằng lệnh, đừng tự sửa timestamp thủ công.

---

## Lỗi 3: DROP TYPE enum thất bại

TypeORM đôi khi sinh migration `DROP TYPE` nhưng quên rằng nhiều cột đang dùng type đó.

```
Error: cannot drop type po_lines_status_enum_old because other objects depend on it
```

**Cách fix thủ công:** Trước khi DROP type cũ, phải ALTER tất cả các cột đang dùng nó sang type mới trước. Xem file `1777714833557-TestFinalSync.ts` làm ví dụ.

> ⚠️ KHÔNG dùng `CASCADE` — sẽ xóa luôn cả cột!

---

## Quy trình chuẩn khi làm tính năng mới

```bash
# 1. Sync với main
git pull origin main
npm run db:reset && npm run migration:run

# 2. Sửa entity

# 3. Generate migration
npm run migration:generate -- src/database/migrations/TenMoTa

# 4. Đọc lướt file migration vừa tạo — xem có dòng lạ không

# 5. Test từ đầu
npm run db:reset && npm run migration:run
# Nếu không lỗi → commit cả entity + migration file

# 6. Verify cuối
npm run migration:generate -- src/database/migrations/Test
# Phải ra: "No changes in database schema" → OK
```

---

## Checklist trước khi commit migration

- [ ] DB đã được reset và run migration thành công từ đầu
- [ ] `migration:generate` không tạo thêm file mới (No changes)
- [ ] Commit gồm cả **entity** + **migration file** cùng nhau
