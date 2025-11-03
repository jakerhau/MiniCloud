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
│  │  └─ datasource.yml          # Tự tạo datasource Prometheus
│  └─ dashboards/
│     └─ dashboard.yml           # Tự import các dashboard JSON
└─ dashboards/
   └─ node-exporter-full.json    # Dashboard Node Exporter Full (ID 1860)
```

## Docker Configuration

### docker-compose.yml (ví dụ)

```yaml
services:
  monitoring-grafana-dashboard-server:
    image: grafana/grafana:latest
    container_name: monitoring-grafana-dashboard-server
    ports: ["3120:3000"]
    volumes:
      - ./logging/provisioning:/etc/grafana/provisioning
      - ./logging/dashboards:/var/lib/grafana/dashboards
    networks: [cloud-net]
    restart: unless-stopped
```

> Lưu ý:
> - Thư mục `logging/provisioning` được mount vào `/etc/grafana/provisioning`.
> - Thư mục `logging/dashboards` được mount vào `/var/lib/grafana/dashboards`.
> - Tên service Prometheus trong mạng Docker là `monitoring-prometheus-server` (điều chỉnh cho khớp compose của bạn).

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

- `dashboards/node-exporter-full.json` là dashboard mẫu (ID 1860) để hiển thị các metric của **Node Exporter**.

## Khởi động

```bash
docker compose up -d monitoring-grafana-dashboard-server
docker compose ps
```

## Kiểm thử

1. Mở **Grafana**: `http://localhost:3120`
2. Đăng nhập: `admin / admin` (đổi mật khẩu khi được yêu cầu)
3. Vào **Dashboards → Browse**:
   - Thấy **Node Exporter Full** xuất hiện sẵn (được provisioned)
4. Mở dashboard, kiểm tra các panel:
   - CPU, Memory, Network… hiển thị số liệu realtime



## DNS & Networking

- Service Grafana sẽ tham gia mạng `cloud-net`, có thể truy cập tới Prometheus qua hostname `monitoring-prometheus-server:9090`.


## Bảo mật

- **Đổi mật khẩu admin** sau lần đăng nhập đầu.
- Bật **org role** phù hợp (Viewer/Editor/Admin).
- Giới hạn truy cập Grafana chỉ từ mạng nội bộ hoặc sau reverse proxy có auth.

## Troubleshooting

### Common Issues

- **Dashboard không xuất hiện**:
  - Kiểm tra mount volumes `provisioning/` và `dashboards/`.
  - Xem log Grafana để xác nhận provisioning:
    ```bash
    docker logs monitoring-grafana-dashboard-server | grep -i provision
    ```
- **No data** trên panel:
  - Xem **Prometheus** có đang UP không (http://localhost:9090 → Status → Targets).
  - Kiểm tra lại `url` trong datasource (đúng hostname/port?).

### Debug Commands

```bash
# Kiểm tra container
docker ps
docker logs -f monitoring-grafana-dashboard-server

# Exec shell vào container
docker exec -it monitoring-grafana-dashboard-server sh

# Kiểm tra file provisioning trong container
ls -la /etc/grafana/provisioning/datasources
ls -la /etc/grafana/provisioning/dashboards
ls -la /var/lib/grafana/dashboards
```

## Backup & Restore

### Backup dashboards & provisioning

```bash
# Trên host (đang đứng tại root project)
tar czf grafana-backup-$(date +%F).tar.gz logging/provisioning logging/dashboards
```

### Restore

```bash
tar xzf grafana-backup-YYYY-MM-DD.tar.gz -C .
docker compose restart monitoring-grafana-dashboard-server
```

## Hiệu năng

- Giới hạn thời gian truy vấn (time range) nếu nhiều target để giảm tải.
- Dùng **variables** và **repeat panels** hợp lý.
- Bật **caching** ở reverse proxy (nếu có) cho các static assets.

