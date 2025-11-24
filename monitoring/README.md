# Monitoring Service

Monitoring module cung cấp giám sát cho hệ thống **MiniCloud** dựa trên **Prometheus** và **Node Exporter** 

## Công nghệ sử dụng

- **Metrics Collector**: Prometheus
- **Node-level Metrics**: node_exporter
- **Storage**: Docker volumes

## Cấu trúc thư mục

```
monitoring/
├── prometheus.yml          # Cấu hình Prometheus 
└── README.md               # This file
```

## Docker Configuration

```yaml
monitoring-node-exporter-server:
  image: prom/node-exporter:latest
  ports:
    - "9100:9100"
  networks:
    cloud-net:
      ipv4_address: 172.31.0.9
  restart: unless-stopped

monitoring-prometheus-server:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  networks:
    cloud-net:
      ipv4_address: 172.31.0.11
  restart: unless-stopped
  command:
    - --config.file=/etc/prometheus/prometheus.yml
    - --storage.tsdb.path=/prometheus
    - --web.enable-lifecycle
```


## Access Information

### Prometheus
- **URL**: http://localhost:9090
- **Targets**: *Status* → *Targets*
- **Reload cấu hình**: bật `--web.enable-lifecycle` và gọi:
```bash
curl -X POST http://localhost:9090/-/reload
```

### Node Exporter
- **URL**: http://localhost:9100/metrics
- **Job name**: `node`

## Prometheus Configuration

### Global
- `scrape_interval`: 15s (mặc định cho toàn hệ thống)

### Các scrape jobs (trong `prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "node"
    static_configs:
      - targets: ["monitoring-node-exporter-server:9100"]

  - job_name: "prometheus"
    static_configs:
      - targets: ["monitoring-prometheus-server:9090"]

  - job_name: "frontend"
    metrics_path: /api/metrics
    static_configs:
      - targets: ["web-frontend-server1:3000", "web-frontend-server2:3000"]
```

Job `frontend` thu thập custom metric từ endpoint Next.js `/api/metrics` (ví dụ gauge `frontend_up 1`). Targets sẽ là DOWN nếu các container frontend chưa chạy.

## Khởi động Monitoring
```bash
docker compose up -d monitoring-node-exporter-server monitoring-prometheus-server
docker compose ps monitoring-node-exporter-server monitoring-prometheus-server
```


## Backup và Restore

### Backup Prometheus TSDB (tùy chọn)
Chỉ áp dụng nếu đã thêm volume `prometheus_data:/prometheus`.
```bash
docker compose stop monitoring-prometheus-server
docker run --rm -v prometheus_data:/data -v "$PWD":/backup alpine \
  sh -c "cd /data && tar czf /backup/prometheus_data_$(date +%F).tar.gz ."
docker compose start monitoring-prometheus-server
```
Restore: giải nén trở lại volume `prometheus_data` rồi start lại container.

## Troubleshooting

### Common Issues
- **Target DOWN**: Kiểm tra service name/port, network `cloud-net`, hoặc firewall.
- **Metrics không có nhãn mong muốn**: Xem lại exporter/instrumentation.
- **Không reload được cấu hình**: Chưa bật `--web.enable-lifecycle` hoặc dùng sai URL.

### Logs
```bash
docker compose logs -f monitoring-prometheus-server
docker compose logs -f monitoring-node-exporter-server
```

### Metrics nhanh để kiểm tra
Trong Prometheus UI → *Graph*:
- `up`
- `scrape_duration_seconds`
- `node_cpu_seconds_total`
- `node_memory_MemAvailable_bytes`

## Production Considerations

### Security Hardening
- Chạy Prometheus/Grafana/Alertmanager sau reverse proxy (auth/TLS).
- Hạn chế truy cập UI qua VPN hoặc firewall rules.
- Bật backup định kỳ cho volume dữ liệu.

### High Availability
- Dùng **Prometheus HA** (2 replica + Thanos/Cortex/Mimir nếu cần long-term storage).
- Triển khai **Alertmanager cluster**.
- Load balancer cho Grafana.
