#!/bin/bash
# ─────────────────────────────────────────────────────────────
# backup.sh
# Backup PostgreSQL database
# Chạy thủ công: bash backup.sh
# Chạy tự động (cron): xem hướng dẫn ở cuối file
# ─────────────────────────────────────────────────────────────
set -e

ENV_FILE="$HOME/erp/.env"
BACKUP_DIR="$HOME/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Đọc DB config từ .env ────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Không tìm thấy $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"
DB_USER="${DB_USERNAME:-postgres}"
DB_NAME="${DB_NAME:-erp_demo}"
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
KEEP_DAYS=7

# ── Tạo thư mục backup ───────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Kiểm tra container đang chạy ─────────────────────────────
if ! docker ps --filter "name=erp_postgres" --filter "status=running" | grep -q erp_postgres; then
  echo "❌ Container erp_postgres chưa chạy"
  exit 1
fi

# ── Thực hiện backup ─────────────────────────────────────────
echo ">>> Backup $DB_NAME → $BACKUP_FILE"
docker exec erp_postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "    ✓ Backup xong — $SIZE"

# ── Xóa backup cũ hơn KEEP_DAYS ngày ────────────────────────
echo ">>> Xóa backup cũ hơn $KEEP_DAYS ngày..."
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$KEEP_DAYS -delete
REMAINING=$(ls "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
echo "    ✓ Còn $REMAINING file backup"

echo ""
echo "✅ Backup hoàn tất: $BACKUP_FILE"

# ─────────────────────────────────────────────────────────────
# Cài đặt chạy tự động hàng ngày lúc 2h sáng:
#
#   crontab -e
#   Thêm dòng:
#   0 2 * * * bash /home/erp/erp/scripts/backup.sh >> /home/erp/backups/backup.log 2>&1
# ─────────────────────────────────────────────────────────────
