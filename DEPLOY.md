# DEPLOY GUIDE — ERP Backend

## Kiến trúc tổng quan

```
Ubuntu Server (trong Windows VM, trong mạng LAN)
├── erp_postgres   (Docker) — PostgreSQL 16, data persist
├── erp_minio      (Docker) — Object storage, file persist
├── erp_be         (Docker) — NestJS Backend
├── erp_fe         (Docker) — React + Nginx
└── uptime-kuma    (Docker) — Monitoring dashboard
```

**CI/CD:** GitHub Actions build image → push `ghcr.io` → runner trên Ubuntu pull về chạy.  
**Auto-healing:** Tất cả container dùng `--restart unless-stopped` — tự restart khi crash, tự start khi reboot.

---

## Scripts

Tất cả script nằm trong `scripts/`, đọc config từ `.env` — không lưu password trong code.

| Script | Mục đích | Chạy khi nào |
|---|---|---|
| `01-setup-user.sh` | Tạo Linux user `erp` riêng | Lần đầu, chạy bằng `sudo` |
| `02-setup-docker.sh` | Cài Docker + bật auto-start | Lần đầu, chạy bằng `sudo` |
| `03-start-db.sh` | Khởi động PostgreSQL + MinIO | Lần đầu (DB chạy mãi) |
| `04-start-be.sh` | Pull image BE + chạy container | CI/CD tự gọi |
| `05-seed.sh` | Seed data mẫu vào DB | **Chỉ 1 lần** khi mới deploy |
| `06-start-fe.sh` | Pull image FE + chạy container | CI/CD tự gọi |
| `07-setup-monitoring.sh` | Cài Uptime Kuma | Lần đầu |
| `backup.sh` | Backup PostgreSQL | Thủ công hoặc cron hàng ngày |

---

## Lần đầu setup server (qua UltraViewer)

### Bước 1 — Tạo user riêng

```bash
sudo bash scripts/01-setup-user.sh
```

### Bước 2 — Cài Docker

```bash
sudo bash scripts/02-setup-docker.sh
```

### Bước 3 — Tạo file `.env` production

```bash
sudo su - erp
cp /path/to/repo/.env.example ~/erp/.env
nano ~/erp/.env   # điền các giá trị thật
```

Các giá trị bắt buộc phải đổi:

```env
DB_PASSWORD=<mật khẩu mạnh, không dùng 'postgres'>
JWT_SECRET=<random 64 ký tự>
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
# QUAN TRỌNG: đặt IP LAN của server để client tải được file ảnh/đính kèm
# Không đặt = presigned URL sẽ trả về "localhost:9000" → client không tải được
MINIO_PUBLIC_ENDPOINT=http://<IP_Ubuntu>:9000
APP_URL=http://<IP_Ubuntu_hoặc_hostname>
MAIL_USERNAME=<gmail>
MAIL_PASSWORD=<gmail app password>
```

> **MinIO Public Endpoint**: `MINIO_ENDPOINT=localhost` là host BE dùng để kết nối MinIO nội bộ (ổn).  
> `MINIO_PUBLIC_ENDPOINT` là host mà **trình duyệt** dùng khi tải file qua presigned URL — phải là IP/hostname mà các máy trên LAN có thể truy cập được, ví dụ `http://192.168.1.100:9000`.

> File `.env` không bao giờ commit lên git — chỉ tồn tại trên server.

### Bước 4 — Khởi động Database

```bash
bash scripts/03-start-db.sh
```

### Bước 5 — Deploy BE lần đầu

Sau khi CI/CD đã push image lên ghcr (xem phần CI/CD bên dưới):

```bash
bash scripts/04-start-be.sh <github_owner>
# Ví dụ: bash scripts/04-start-be.sh my-org
```

Migrations tự chạy khi BE start (`migrationsRun: true` trong TypeORM config).

### Bước 6 — Seed data (1 lần duy nhất)

```bash
bash scripts/05-seed.sh
```

### Bước 7 — Deploy FE lần đầu

```bash
bash scripts/06-start-fe.sh <github_owner>
```

### Bước 8 — Setup Monitoring

```bash
bash scripts/07-setup-monitoring.sh
```

Vào `http://<IP_server>:3001` → tạo tài khoản → thêm 4 monitor → cấu hình Telegram alert.

### Bước 9 — Cài backup tự động

```bash
crontab -e
# Thêm dòng — backup 2h sáng mỗi ngày:
0 2 * * * bash /home/erp/erp/scripts/backup.sh >> /home/erp/backups/backup.log 2>&1
```

---

## CI/CD (tự động sau mỗi lần push)

### GitHub Actions Runner

Vào repo GitHub → **Settings → Actions → Runners → New self-hosted runner** → chọn Linux x64 → làm theo hướng dẫn.

```bash
# Cài runner chạy như service
cd ~/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
```

### Workflow BE (`.github/workflows/deploy.yml` trong repo be)

```yaml
name: Deploy BE
on:
  push:
    branches: [main]

env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/erp-be

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.IMAGE }}:latest,${{ env.IMAGE }}:${{ github.sha }}

  deploy:
    needs: build-push
    runs-on: self-hosted
    steps:
      - name: Deploy BE
        run: bash /home/erp/erp/scripts/04-start-be.sh ${{ github.repository_owner }}
```

### Workflow FE (`.github/workflows/deploy.yml` trong repo fe)

```yaml
name: Deploy FE
on:
  push:
    branches: [main]

env:
  IMAGE: ghcr.io/${{ github.repository_owner }}/erp-fe

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.IMAGE }}:latest,${{ env.IMAGE }}:${{ github.sha }}

  deploy:
    needs: build-push
    runs-on: self-hosted
    steps:
      - name: Deploy FE
        run: bash /home/erp/erp/scripts/06-start-fe.sh ${{ github.repository_owner }}
```

---

## Auto-healing

| Tình huống | Hành vi |
|---|---|
| Container crash | Docker tự restart ngay lập tức |
| Server reboot | Tất cả container tự start cùng Docker daemon |
| `docker stop` thủ công | Không tự restart (đúng ý định) |

Kiểm tra Docker tự start khi reboot:
```bash
sudo systemctl is-enabled docker   # phải ra: enabled
```

---

## Monitoring

Uptime Kuma tại `http://<IP_server>:3001` monitor 4 endpoint:

| Monitor | URL | Interval |
|---|---|---|
| BE Health | `http://localhost:3000/health` | 60s |
| Frontend | `http://localhost:80` | 60s |
| PostgreSQL | TCP `localhost:5432` | 60s |
| MinIO | `http://localhost:9000/minio/health/live` | 60s |

Alert qua Telegram khi bất kỳ service nào xuống.

---

## Backup & Restore

```bash
# Backup thủ công
bash scripts/backup.sh

# Restore từ file backup
cat ~/backups/backup_erp_demo_20260524_020000.sql \
  | docker exec -i erp_postgres psql -U postgres erp_demo
```

---

## Lệnh thường dùng

```bash
# Xem status tất cả container
docker ps

# Xem log realtime
docker logs -f erp_be
docker logs -f erp_fe

# Restart service
docker restart erp_be
docker restart erp_fe

# Kiểm tra BE health
curl http://localhost:3000/health

# Xem tài nguyên đang dùng
docker stats --no-stream
```

---

## Xử lý sự cố

### BE không start

```bash
docker logs erp_be
# Thường do: sai .env, DB chưa ready, port bị chiếm
```

### Migration lỗi

```bash
docker logs erp_be | grep -i "migration\|error"
```

### Không truy cập được từ máy khác trong LAN

```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 3000
sudo ufw allow 3001   # Uptime Kuma
```
