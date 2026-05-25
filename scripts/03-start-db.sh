#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 03-start-db.sh
# Khởi động PostgreSQL + MinIO (chạy 1 lần, tồn tại mãi mãi)
# Chạy với: bash 03-start-db.sh
# ─────────────────────────────────────────────────────────────
set -e

ENV_FILE="$HOME/erp/.env"
COMPOSE_FILE="$HOME/erp/docker-compose.db.yml"

# ── Kiểm tra .env ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Không tìm thấy $ENV_FILE"
  echo "   Tạo file .env trước (xem .env.example trong repo BE)"
  exit 1
fi

source "$ENV_FILE"

# Production dùng DB_PORT từ .env (nên set 5432)
# Dev dùng 5433 để tránh xung đột với Postgres cài sẵn trên máy
HOST_DB_PORT="${DB_PORT:-5432}"
echo ">>> Postgres sẽ expose ra host port: $HOST_DB_PORT"

# ── Tạo docker-compose.db.yml ────────────────────────────────
# Dùng 'EOF' (single-quote) để không expand biến bash trong heredoc
# Sau đó dùng sed để inject HOST_DB_PORT vào đúng chỗ
echo ">>> Tạo $COMPOSE_FILE..."
cat > "$COMPOSE_FILE" << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: erp_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "__HOST_DB_PORT__:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: erp_minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  minio-init:
    image: minio/mc:latest
    container_name: erp_minio_init
    depends_on: [minio]
    restart: "no"
    environment:
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: ${MINIO_BUCKET:-erp-files}
    entrypoint: >
      /bin/sh -c "
      sleep 5;
      mc alias set local http://minio:9000 $$MINIO_ACCESS_KEY $$MINIO_SECRET_KEY;
      mc mb local/$$MINIO_BUCKET --ignore-existing;
      mc anonymous set download local/$$MINIO_BUCKET;
      echo 'MinIO bucket ready!';
      exit 0;
      "

volumes:
  postgres_data:
  minio_data:
EOF

# Inject port thực vào file
sed -i "s/__HOST_DB_PORT__/$HOST_DB_PORT/" "$COMPOSE_FILE"
echo "    ✓ Done"

# ── Start DB ─────────────────────────────────────────────────
echo ">>> Khởi động PostgreSQL + MinIO..."
cd "$HOME/erp"
docker compose -f docker-compose.db.yml --env-file .env up -d

echo ""
echo ">>> Chờ PostgreSQL sẵn sàng..."
for i in {1..15}; do
  if docker exec erp_postgres pg_isready -U "$DB_USERNAME" -d "$DB_NAME" &>/dev/null; then
    echo "    ✓ PostgreSQL đã sẵn sàng"
    break
  fi
  echo "    Đang chờ... ($i/15)"
  sleep 2
done

echo ""
echo "✅ Database đang chạy:"
echo "   PostgreSQL : localhost:$HOST_DB_PORT"
echo "   MinIO API  : localhost:9000"
echo "   MinIO UI   : http://localhost:9001"
echo ""
echo "   Tiếp theo: chạy script 04-start-be.sh"
