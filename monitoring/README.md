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
monitoring-prometheus-server:
image: prom/prometheus:latest
container_name: monitoring-prometheus-server
ports:
    - "9090:9090"
networks:
    - cloud-net
volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus_data:/prometheus

command:
    - --config.file=/etc/prometheus/prometheus.yml
    - --storage.tsdb.path=/prometheus
    - --web.enable-lifecycle          
restart: unless-stopped

monitoring-node-exporter-server:
image: prom/node-exporter:latest
container_name: monitoring-node-exporter-server
ports:
    - "9100:9100"
networks:
    - cloud-net
restart: unless-stopped

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

### Jobs mặc định (đã được cấu hình trong `prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "node"
    static_configs:
      - targets: ["monitoring-node-exporter-server:9100"]

  # tự giám sát chính Prometheus
  - job_name: "prometheus"
    static_configs:
      - targets: ["monitoring-prometheus-server:9090"]
```


## Backup và Restore

### Backup Prometheus TSDB
Dừng container để snapshot nhất quán hoặc dùng API snapshot:

```bash
# Dừng tạm thời (đơn giản)
docker stop monitoring-prometheus-server
docker run --rm -v prometheus_data:/data -v $(pwd):/backup alpine \
  sh -c "cd /data && tar czf /backup/prometheus_data_$(date +%F).tar.gz ."
docker start monitoring-prometheus-server
```

### Restore
Giải nén vào volume `prometheus_data` rồi khởi động lại container.

## Troubleshooting

### Common Issues
- **Target DOWN**: Kiểm tra service name/port, network `cloud-net`, hoặc firewall.
- **Metrics không có nhãn mong muốn**: Xem lại exporter/instrumentation.
- **Không reload được cấu hình**: Chưa bật `--web.enable-lifecycle` hoặc dùng sai URL.

### Logs
```bash
# Xem logs
docker logs -f monitoring-prometheus-server
docker logs -f monitoring-node-exporter-server
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
