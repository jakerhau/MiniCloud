# Logging / Visualization Server (Grafana)

Dịch vụ **Logging / Visualization** sử dụng **Grafana** để trực quan hoá metrics (và có thể mở rộng sang logs) trong hệ thống **MiniCloud**.

## Công nghệ sử dụng

- **Visualization**: Grafana
- **Metrics datasource**: Prometheus (đã triển khai ở server Monitoring)
- **Provisioning**: Tự động hoá datasource & dashboards qua YAML

## Mục tiêu

- Hiển thị **CPU / Memory / Network**… từ **Node Exporter** thông qua **Prometheus**.
- Cho phép quản trị viên xem dashboard ngay sau khi khởi động (không cần thao tác tay).

## Cấu trúc thư mục 

```
logging/
├─ README.md
├─ provisioning/
│  ├─ datasources/
│  │  └─ datasource.yml          # Khai báo datasource Prometheus
│  └─ dashboards/
│     └─ dashboard.yml           # Provider trỏ tới /var/lib/grafana/dashboards
├─ dashboards/                   # (Tùy chọn) chứa file JSON nếu muốn mount trực tiếp
│  └─ System Health of 52200205.json   # Dashboard hiện có (được bạn cung cấp)
└─ grafana-data/                # (Trong compose) mount vào /var/lib/grafana để lưu state, dashboards import
```

## Docker Configuration

### docker-compose.yml (đang dùng thực tế)

```yaml
logging-server:
  image: grafana/grafana:latest
  ports:
    - "3120:3000"
  volumes:
    - ./logging/provisioning/:/etc/grafana/provisioning/
    - ./logging/grafana-data:/var/lib/grafana
  networks:
    cloud-net:
      ipv4_address: 172.31.0.5
  restart: unless-stopped
```

Giải thích volumes:
- Provisioning YAML nằm trong `/etc/grafana/provisioning/`.
- Toàn bộ trạng thái Grafana (bao gồm dashboards đã import, config nội bộ) nằm trong `./logging/grafana-data` (→ `/var/lib/grafana`).
- Vì mount toàn bộ `grafana-data`, provider trong `dashboard.yml` trỏ tới `/var/lib/grafana/dashboards` nghĩa là Grafana sẽ tìm JSON trong thư mục con `grafana-data/dashboards` bên trong volume. Hiện tại repo có thư mục `dashboards/` riêng nhưng CHƯA được mount; để auto import `System Health...` bạn cần đảm bảo file JSON xuất hiện bên trong `grafana-data/dashboards/` (copy thủ công hoặc thêm volume bổ sung).

Tùy chọn: Nếu muốn mount thư mục nguồn `logging/dashboards` trực tiếp thay vì copy tay, có thể sửa compose:
```yaml
  volumes:
    - ./logging/provisioning/:/etc/grafana/provisioning/
    - ./logging/grafana-data:/var/lib/grafana
    - ./logging/dashboards:/var/lib/grafana/dashboards:ro
```
Khi đó mỗi lần cập nhật JSON ở repo sẽ có hiệu lực ngay (dashboard sẽ được re-provision khi Grafana restart).

## Provisioning

### 1) Datasource: `provisioning/datasources/datasource.yml`

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://monitoring-prometheus-server:9090
    isDefault: true
```

### 2) Dashboards: `provisioning/dashboards/dashboard.yml`

```yaml
apiVersion: 1
providers:
  - name: "Node Exporter Full"
    orgId: 1
    folder: ""
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
```

### 3) Dashboard JSON

- `dashboards/System Health of 52200205.json`: Dashboard hiện có trong repo (đặt tên tùy chỉnh). Để được auto import cần đặt file vào đường dẫn mà provider đọc: `grafana-data/dashboards/` hoặc mount `logging/dashboards` → `/var/lib/grafana/dashboards`.
- (Tùy chọn) `dashboards/node-exporter-full.json`: Thêm file nếu muốn sử dụng dashboard chuẩn ID 1860 của cộng đồng.

## Khởi động

```bash
docker compose up -d logging-server
docker compose ps logging-server
```

## Kiểm thử

1. Mở **Grafana**: `http://localhost:3120`
2. Đăng nhập: `admin / admin` (đổi mật khẩu khi được yêu cầu)
3. Vào **Dashboards → Browse**:
  - Nếu đã đặt file JSON vào đúng path provisioning (ví dụ `grafana-data/dashboards/System Health of 52200205.json`) dashboard sẽ xuất hiện tự động.
4. Mở dashboard, kiểm tra các panel CPU, Memory, Network…
5. Nếu dashboard KHÔNG thấy: kiểm tra xem JSON đã nằm trong thư mục mà provider trỏ tới (theo phần trên) và restart container.



## DNS & Networking

- Service Grafana tham gia mạng `cloud-net`, truy cập Prometheus qua hostname `monitoring-prometheus-server:9090` (theo datasource.yml). Đảm bảo tên service Prometheus trong compose đúng với giá trị này; nếu khác, chỉnh lại `url` trong datasource.


## Bảo mật

- **Đổi mật khẩu admin** sau lần đăng nhập đầu.
- Bật **org role** phù hợp (Viewer/Editor/Admin).
- Giới hạn truy cập Grafana chỉ từ mạng nội bộ hoặc sau reverse proxy có auth.

## Troubleshooting

### Common Issues

-- **Dashboard không xuất hiện**:
  - File JSON chưa ở đúng đường dẫn provider (`/var/lib/grafana/dashboards`).
  - Nếu dùng approach mount riêng: kiểm tra volume `./logging/dashboards:/var/lib/grafana/dashboards` có được thêm không.
  - Xem log provisioning:
    ```bash
    docker compose logs logging-server | Select-String -Pattern provision
    ```
- **No data** trên panel:
  - Xem **Prometheus** có đang UP không (http://localhost:9090 → Status → Targets).
  - Kiểm tra lại `url` trong datasource (đúng hostname/port?).

### Debug Commands

```bash
# Kiểm tra container
docker compose ps logging-server
docker compose logs -f logging-server

# Exec shell vào container
docker compose exec logging-server sh

# Kiểm tra file provisioning trong container
ls -la /etc/grafana/provisioning/datasources
ls -la /etc/grafana/provisioning/dashboards
ls -la /var/lib/grafana/dashboards
```

## Backup & Restore

### Backup dashboards & provisioning

```bash
# Trên host (root project)
tar czf grafana-backup-$(date +%F).tar.gz logging/provisioning logging/grafana-data
```

### Restore

```bash
tar xzf grafana-backup-YYYY-MM-DD.tar.gz -C .
docker compose restart logging-server
```

## Hiệu năng

- Giới hạn thời gian truy vấn (time range) nếu nhiều target để giảm tải.
- Dùng **variables** và **repeat panels** hợp lý.
- Bật **caching** ở reverse proxy (nếu có) cho các static assets.

