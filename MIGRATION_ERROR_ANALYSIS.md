# 🚨 Migration Error Analysis - Vấn đề của Danh

## 1️⃣ DANH SÁCH CÁC FILE MIGRATION LỖI

```
❌ 1777278457802-AddFilesColumnToStyles.ts
❌ 1777321075630-AddStyleIdToPoLines.ts
❌ 1777395960530-AddImageUrlToSizeRows.ts
❌ 1777500000000-AlterSection1ImageUrlType.ts
❌ 1777500000000-AddConsumptionPerUnitToBomLines.ts (trùng timestamp)
❌ 1778000000000-ReplaceMaterialsWithAccessories.ts
❌ 1779000000000-AddStyleIdAndMasterPoIdToBoms.ts
❌ 1780000000000-AddSampleVersionColumns.ts
❌ 1781000000000-RefactorPoLineAddColorVersion.ts
```

**Commit gây lỗi:**
- `389d3f7` - "rd" (28/4 01:52 AM)
- `022979c` - "Luong PO" (29/4 14:16 PM)

---

## 2️⃣ NGUYÊN LÝ HOẠT ĐỘNG CỦA MIGRATION

### A. TypeORM Migration là gì?

**Migration = Một file chứa các lệnh SQL để thay đổi database schema**

```typescript
// Example migration
export class CreateUsersTable1776014903006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Chạy lên trên: CREATE TABLE users
    await queryRunner.query(`CREATE TABLE "users" (...)`);
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Chạy xuống: DROP TABLE users
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

### B. Quy trình hoạt động

```
1. Bạn sửa Entity (code TypeScript)
   ↓
2. Chạy: npm run migration:generate
   ↓
3. TypeORM so sánh:
   - Entity định nghĩa trong code
   - vs Database hiện tại
   ↓
4. Tự động sinh ra file migration dựa trên SỰ KHÁC BIỆT
   ↓
5. Chạy: npm run migration:run
   ↓
6. File migration được thực thi → Database cập nhật
```

### C. Điều quan trọng

✅ **Database phải LUÔN SYNC với migrations đã chạy**

```
migrations table (PostgreSQL):
┌─────────────────────────────────────┐
│ id  │ timestamp        │ name        │
├─────┼──────────────────┼─────────────┤
│ 1   │ 1776014903006    │ CreateUser  │
│ 2   │ 1776108996824    │ CreateMaster│
│ 3   │ 1777000000000    │ RefactorSty │
│ ... │ ...              │ ...         │
└─────────────────────────────────────┘

Migrations này đã "chạy rồi" → DB có tables từ chúng
```

---

## 3️⃣ NGUYÊN NHÂN TẠI SAO DANH BỊ LỖI

### Problem Statement

```
Migration: 1777278457802-AddFilesColumnToStyles.ts
Error: relation "line_color_cards" does not exist

Tại sao?
```

### Root Cause

**Danh chạy `npm run migration:generate` khi Database của Danh khác với Database của main**

```
Timeline:
─────────────────────────────────────────────────────────

main branch (trước Danh pull):
✅ users, materials, po_lines, boms, ...
❌ line_color_cards (chưa có)
❌ styles (chưa có)

Danh's branch (lúc Danh chạy migration:generate):
✅ users, materials, po_lines, boms, ...
✅ line_color_cards (đã dev)  ← Danh thêm
✅ styles (đã dev)             ← Danh thêm
```

### Điều xảy ra

```
1. Danh sửa entities (thêm styles, line_color_cards, etc.)
   ↓
2. Danh chạy: npm run migration:generate
   ↓
3. TypeORM nhìn vào DB của Danh (CÓ line_color_cards)
   → So sánh: entities vs Danh's DB
   → Sinh ra migration: "DROP CONSTRAINT line_color_cards, CREATE TABLE..."
   ↓
4. File migration được commit
   ↓
5. Merge vào main
   ↓
6. Chạy: npm run migration:run trên main
   ↓
7. ❌ LỖI! Vì main's DB chưa có line_color_cards
      Migration cố DROP CONSTRAINT từ table không tồn tại
```

### Minh họa cụ thể

```sql
-- File migration 1777278457802-AddFilesColumnToStyles.ts do Danh sinh ra

-- Dòng 10: Cố DROP CONSTRAINT từ line_color_cards
ALTER TABLE "line_color_cards" DROP CONSTRAINT "FK_line_color_cards_line_color";
                   ↓
          Nhưng table này CHƯA TỒN TẠI trên main!
                   ↓
               ❌ LỖI
```

---

## 4️⃣ TẠI SAO ĐIỀU NÀY XẢY RA?

### Sai lầm của Danh

```
❌ Danh làm việc trên branch riêng (Danh264, DanhTask284B)
❌ Database của Danh → đã có nhiều features (dev hoàn chỉnh)
❌ Main branch → chưa merge những features đó
❌ Khi chạy migration:generate → TypeORM sinh file dựa trên DB của Danh
❌ File migration này giả định DB đã có tất cả những table/features của Danh
❌ Khi merge về main → main's DB KHÔNG có những table đó → LỖI
```

### Sơ đồ

```
main branch                    Danh's branch (Danh264)
─────────────────────────────────────────────────────
✅ users                       ✅ users
✅ materials                   ✅ materials  
✅ po_lines                    ✅ po_lines
❌ line_color_cards            ✅ line_color_cards ← Danh thêm
❌ styles                      ✅ styles ← Danh thêm

Danh chạy migration:generate ở đây ↑
→ Sinh file: "DROP/CREATE line_color_cards, styles..."
→ Merge về main
→ Main chạy migration
→ LỖI: line_color_cards không tồn tại
```

---

## 5️⃣ GIẢI PHÁP

### Cách tránh trong tương lai

```bash
# ✅ TRƯỚC KHI chạy migration:generate

# 1. Kéo code mới từ main
git pull origin main

# 2. Reset database sạch sẽ (sync với main)
npm run db:reset
npm run migration:run

# 3. Giờ database của bạn = database của main
# → migration:generate sẽ CHÍNH XÁC

# 4. Chạy migration:generate
npm run migration:generate -- src/database/migrations/MyFeatureName

# 5. KIỂM TRA file migration trước commit
# → Xóa những dòng DROP CONSTRAINT lạ lạ
# → Giữ lại những dòng cần thiết

# 6. Test migration
npm run db:reset
npm run migration:run
# → Phải thành công trên database sạch
```

### Nguyên tắc vàng

```
┌────────────────────────────────────────────────────────┐
│ 1. Database phải LUÔN sync với main branch             │
│ 2. Kiểm tra file migration trước commit                │
│ 3. Test migration trên database sạch                   │
│ 4. Không bao giờ commit migration file lạ lạ           │
└────────────────────────────────────────────────────────┘
```

---

## 6️⃣ HÀNH ĐỘNG HIỆN TẠI

```bash
# 1. Xóa các file migration lỗi
rm src/database/migrations/1777278457802-*.ts
rm src/database/migrations/1777321075630-*.ts
rm src/database/migrations/1777395960530-*.ts
rm src/database/migrations/1777500000000-*.ts
rm src/database/migrations/1778000000000-*.ts
rm src/database/migrations/1779000000000-*.ts
rm src/database/migrations/1780000000000-*.ts
rm src/database/migrations/1781000000000-*.ts

# 2. Reset database
npm run db:reset

# 3. Chạy migrations lại
npm run migration:run

# 4. Verify
npm run migration:show
# → Tất cả migration đều chạy thành công ✅
```

---

**Thời gian:** 28-29/4/2026  
**Người commit:** Đặng Danh  
**Loại lỗi:** Migration dependency order violation  
**Mức độ:** HIGH - Blocking production deployment
