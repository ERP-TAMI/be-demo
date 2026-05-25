#!/bin/bash
# ─────────────────────────────────────────────────────────────
# 02-setup-docker.sh
# Cài Docker + bật auto-start khi reboot
# Chạy với: sudo bash 02-setup-docker.sh
# ─────────────────────────────────────────────────────────────
set -e

echo ">>> Kiểm tra Docker..."
if command -v docker &>/dev/null; then
  echo "    Docker đã cài: $(docker --version)"
else
  echo "    Đang cài Docker..."
  curl -fsSL https://get.docker.com | sh
  echo "    ✓ Đã cài Docker"
fi

echo ">>> Bật Docker auto-start khi reboot..."
systemctl enable docker
systemctl start docker
echo "    ✓ Done"

echo ""
echo "✅ Xong! Docker version: $(docker --version)"
echo "   Tiếp theo: chạy script 03-start-db.sh với user erp"
