#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 01-setup-user.sh
# Tạo user riêng để chạy ERP project (không dùng root/ubuntu)
# Chạy với: sudo bash 01-setup-user.sh
# ─────────────────────────────────────────────────────────────
set -e

ERP_USER="erp"
ERP_HOME="/home/$ERP_USER"

echo ">>> Tạo user '$ERP_USER'..."
if id "$ERP_USER" &>/dev/null; then
  echo "    User '$ERP_USER' đã tồn tại, bỏ qua."
else
  useradd -m -s /bin/bash "$ERP_USER"
  echo "    ✓ Đã tạo user '$ERP_USER'"
fi

echo ">>> Thêm '$ERP_USER' vào group docker..."
usermod -aG docker "$ERP_USER"
echo "    ✓ Done"

echo ">>> Tạo thư mục làm việc..."
mkdir -p "$ERP_HOME/erp"
mkdir -p "$ERP_HOME/backups"
chown -R "$ERP_USER:$ERP_USER" "$ERP_HOME/erp"
chown -R "$ERP_USER:$ERP_USER" "$ERP_HOME/backups"
echo "    ✓ $ERP_HOME/erp"
echo "    ✓ $ERP_HOME/backups"

echo ""
echo "✅ Xong! Tiếp theo:"
echo "   1. sudo su - $ERP_USER"
echo "   2. Tạo file /home/$ERP_USER/erp/.env (xem .env.example)"
echo "   3. Chạy script 02-setup-docker.sh"
