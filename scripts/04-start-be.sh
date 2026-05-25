#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 04-start-be.sh
# Pull image BE mới nhất và chạy container
# Chạy với: bash 04-start-be.sh <github_owner>
# Ví dụ:    bash 04-start-be.sh my-org
# ─────────────────────────────────────────────────────────────
set -e

GITHUB_OWNER="${1:?'❌ Thiếu tham số: bash 04-start-be.sh <github_owner>'}"
IMAGE="ghcr.io/$GITHUB_OWNER/erp-be:latest"
ENV_FILE="$HOME/erp/.env"

# ── Kiểm tra .env ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Không tìm thấy $ENV_FILE"
  exit 1
fi

echo ">>> Pull image $IMAGE..."
docker pull "$IMAGE"

echo ">>> Dừng container cũ (nếu có)..."
docker stop erp_be 2>/dev/null && docker rm erp_be 2>/dev/null || true

echo ">>> Khởi động BE..."
docker run -d \
  --name erp_be \
  --network host \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -e DB_HOST=localhost \
  -e MINIO_ENDPOINT=localhost \
  "$IMAGE"

echo ""
echo ">>> Chờ BE sẵn sàng..."
for i in {1..20}; do
  if curl -sf http://localhost:3000/health &>/dev/null; then
    echo "    ✓ BE đang chạy"
    break
  fi
  echo "    Đang chờ... ($i/20)"
  sleep 3
done

echo ""
echo "✅ Backend đang chạy:"
echo "   API : http://localhost:3000/api/v1"
echo "   Health: http://localhost:3000/health"
echo ""
echo "   Nếu lần đầu deploy → chạy script 05-seed.sh để tạo data mẫu"
echo "   Tiếp theo: chạy script 06-start-fe.sh"
