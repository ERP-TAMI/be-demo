#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 06-start-fe.sh
# Pull image FE mới nhất và chạy container
# Chạy với: bash 06-start-fe.sh <github_owner>
# Ví dụ:    bash 06-start-fe.sh my-org
# ─────────────────────────────────────────────────────────────
set -e

GITHUB_OWNER="${1:?'❌ Thiếu tham số: bash 06-start-fe.sh <github_owner>'}"
IMAGE="ghcr.io/$GITHUB_OWNER/erp-fe:latest"

echo ">>> Pull image $IMAGE..."
docker pull "$IMAGE"

echo ">>> Dừng container cũ (nếu có)..."
docker stop erp_fe 2>/dev/null && docker rm erp_fe 2>/dev/null || true

echo ">>> Khởi động FE..."
docker run -d \
  --name erp_fe \
  --network host \
  --restart unless-stopped \
  "$IMAGE"

echo ""
echo ">>> Chờ FE sẵn sàng..."
for i in {1..10}; do
  if curl -sf http://localhost:80 &>/dev/null; then
    echo "    ✓ FE đang chạy"
    break
  fi
  echo "    Đang chờ... ($i/10)"
  sleep 2
done

# Lấy IP máy để in ra
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Frontend đang chạy:"
echo "   Local  : http://localhost"
echo "   Network: http://$SERVER_IP"
echo ""
echo "   Các máy trong LAN truy cập: http://$SERVER_IP"
