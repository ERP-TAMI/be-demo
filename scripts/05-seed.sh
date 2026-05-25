#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 05-seed.sh
# Chạy seed data vào database (CHỈ CHẠY 1 LẦN khi mới deploy)
# Chạy với: bash 05-seed.sh
# ─────────────────────────────────────────────────────────────
set -e

echo "⚠️  CẢNH BÁO: Script này tạo data mẫu vào database."
echo "   Chỉ chạy 1 lần khi mới setup server lần đầu."
echo ""
read -p "Bạn chắc chắn muốn chạy seed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Hủy."
  exit 0
fi

echo ""
echo ">>> Kiểm tra BE đang chạy..."
if ! docker ps --filter "name=erp_be" --filter "status=running" | grep -q erp_be; then
  echo "❌ Container erp_be chưa chạy. Chạy 04-start-be.sh trước."
  exit 1
fi

echo ">>> Chạy seed..."
docker exec erp_be node dist/database/seeds/seed-all.js

echo ""
echo "✅ Seed hoàn tất! Tài khoản mặc định (password: Admin@123):"
echo ""
echo "   Email                Role"
echo "   ─────────────────────────────────────"
echo "   admin@erp.local      Admin"
echo "   sa@erp.local         Giám đốc"
echo "   tpkh@erp.local       TP Kế hoạch"
echo "   nvkh@erp.local       NV Kế hoạch"
echo "   rd@erp.local         R&D"
echo "   kt@erp.local         Kế toán"
echo ""
echo "⚠️  Đổi password ngay sau khi đăng nhập lần đầu!"
