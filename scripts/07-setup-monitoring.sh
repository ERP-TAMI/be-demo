#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 07-setup-monitoring.sh
# Cài Uptime Kuma — dashboard monitoring + alert Telegram
# Chạy với: bash 07-setup-monitoring.sh
# ─────────────────────────────────────────────────────────────
set -e

echo ">>> Khởi động Uptime Kuma..."
docker stop uptime-kuma 2>/dev/null && docker rm uptime-kuma 2>/dev/null || true

docker run -d \
  --name uptime-kuma \
  --restart unless-stopped \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:latest

echo ""
echo ">>> Chờ Uptime Kuma sẵn sàng..."
for i in {1..15}; do
  if curl -sf http://localhost:3001 &>/dev/null; then
    echo "    ✓ Uptime Kuma đang chạy"
    break
  fi
  echo "    Đang chờ... ($i/15)"
  sleep 3
done

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Uptime Kuma đang chạy: http://$SERVER_IP:3001"
echo ""
echo "   Sau khi vào dashboard, thêm các monitor sau:"
echo ""
echo "   ┌─────────────────┬────────────────────────────────────────────┬──────────┐"
echo "   │ Tên             │ URL / Host                                 │ Interval │"
echo "   ├─────────────────┼────────────────────────────────────────────┼──────────┤"
echo "   │ BE Health       │ http://localhost:3000/health               │ 60s      │"
echo "   │ Frontend        │ http://localhost:80                        │ 60s      │"
echo "   │ PostgreSQL      │ TCP: localhost:5432                        │ 60s      │"
echo "   │ MinIO           │ http://localhost:9000/minio/health/live    │ 60s      │"
echo "   └─────────────────┴────────────────────────────────────────────┴──────────┘"
echo ""
echo "   Cấu hình Telegram alert:"
echo "   1. Tạo bot: nhắn @BotFather trên Telegram → /newbot"
echo "   2. Lấy token từ BotFather"
echo "   3. Tìm chat ID: nhắn bot rồi vào https://api.telegram.org/bot<TOKEN>/getUpdates"
echo "   4. Uptime Kuma → Settings → Notifications → Add → Telegram"
