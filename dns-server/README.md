# DNS Server

DNS server sử dụng Bind9 để cung cấp DNS resolution cho các domain nội bộ trong hệ thống MiniCloud.

## Công nghệ sử dụng

- **DNS Server**: Bind9 (BIND)
- **Base Image**: Debian
- **Configuration**: named.conf
- **Zone Files**: Custom DNS zones

## Bind9 Configuration

### Basic Settings
- **Port**: Host 53 → Container 53 (UDP/TCP) (docker-compose map `53:53/udp`, `53:53/tcp`)
- **Configuration**: /etc/bind/named.conf
- **Zone Directory**: /etc/bind/zones/
- **User**: bind:bind

### Environment Variables
```bash
# No specific environment variables needed
# Configuration is file-based
```

## Cấu trúc thư mục

```
dns-server/
├── Dockerfile              # Docker configuration
├── named.conf              # Main Bind9 configuration
├── zones/                  # DNS zone files
│   ├── db.localhost       # localhost zone
│   └── db.cloud.local     # cloud.local zone
└── README.md              # This file
```

## Docker Configuration

```yaml
dns-server:
  build:
    context: ./dns-server
    dockerfile: Dockerfile
  image: 52200292/dns-server:latest
  ports:
    - "53:53/udp"   # Host port 53 -> container 53 UDP
    - "53:53/tcp"   # Host port 53 -> container 53 TCP
  networks:
    - cloud-net
  volumes:
    - ./dns-server/zones:/etc/bind/zones
    - ./dns-server/named.conf:/etc/bind/named.conf
  restart: unless-stopped
```

## DNS Zones Configuration

### 1. Main Configuration (named.conf)
```conf
options {
    directory "/var/cache/bind";
    allow-recursion { any; };
    allow-query { any; };
    dnssec-validation auto;
    listen-on-v6 { any; };
};

zone "localhost" IN {
    type master;
    file "/etc/bind/zones/db.localhost";
};

zone "cloud.local" IN {
    type master;
    file "/etc/bind/zones/db.cloud.local";
};
```

### 2. localhost Zone (db.localhost)
```conf
$TTL 604800
@   IN  SOA localhost. root.localhost. (
         2 604800 86400 2419200 604800 )
    IN  NS  localhost.
    IN  A   127.0.0.1
```

### 3. cloud.local Zone (db.cloud.local) – HIỆN TẠI
Khớp đúng nội dung file thực tế `zones/db.cloud.local`:
```conf
$TTL 1H
@   IN  SOA ns.cloud.local. admin.cloud.local. (1 1H 15M 1W 1H)
  IN  NS   ns.cloud.local.

ns          IN  A   172.31.0.8
frontend-1  IN  A   172.31.0.2
frontend-2  IN  A   172.31.0.3
backend     IN  A   172.31.0.7
auth        IN  A   172.31.0.6
database    IN  A   172.31.0.10
storage     IN  A   172.31.0.4
```

Ghi chú: Hai instance frontend được phân biệt bằng các label `frontend-1` và `frontend-2` thay vì một bản ghi chung.

## DNS Resolution

### Internal Services (Theo zone hiện tại)
- `frontend-1.cloud.local` → 172.31.0.2
- `frontend-2.cloud.local` → 172.31.0.3
- `backend.cloud.local` → 172.31.0.7
- `auth.cloud.local` → 172.31.0.6
- `database.cloud.local` → 172.31.0.10
- `storage.cloud.local` → 172.31.0.4
- `ns.cloud.local` → 172.31.0.8

### localhost Resolution
- **localhost** → 127.0.0.1

## DNS Testing

Host port dùng 53 (port mặc định của DNS) nên không cần chỉ định port trong các lệnh.

### Command Line Testing (Host)
```bash
# Liệt kê bản ghi chính
dig @localhost cloud.local ANY

# Kiểm tra từng service
dig @localhost frontend-1.cloud.local A
dig @localhost frontend-2.cloud.local A
dig @localhost backend.cloud.local A
dig @localhost auth.cloud.local A
dig @localhost storage.cloud.local A

# nslookup ví dụ (port 53 là mặc định)
nslookup backend.cloud.local localhost
nslookup frontend-1.cloud.local localhost

# Reverse lookup (nếu có PTR – hiện CHƯA cấu hình)
# nslookup 172.31.0.2 localhost
```

### From Other Containers
Container nội bộ truy vấn trực tiếp port 53:
```bash
docker-compose exec backend dig @dns-server frontend-1.cloud.local A
docker-compose exec backend dig @dns-server frontend-2.cloud.local A
docker-compose exec backend dig @dns-server database.cloud.local A
```

## DNS Configuration Management

### Adding New Records (Ví dụ phù hợp dải 172.31.0.x)
```conf
# Thêm service mới
cache       IN  A   172.31.0.13
```

### Adding New Zones
```conf
# Add new zone to named.conf
zone "newdomain.local" IN {
    type master;
    file "/etc/bind/zones/db.newdomain.local";
};
```

### CNAME Records (Phù hợp với tên record thực tế)
```conf
www.frontend-1   IN  CNAME  frontend-1.cloud.local.
www.frontend-2   IN  CNAME  frontend-2.cloud.local.
api.backend      IN  CNAME  backend.cloud.local.
```

## Security Configuration

### Access Control (THỰC TẾ vs Dự Kiến)
Hiện tại `named.conf` cho phép:
```conf
allow-recursion { any; };
allow-query { any; };
```
Nghĩa là DNS mở cho mọi nguồn. Nếu muốn hạn chế chỉ mạng nội bộ 172.31.0.0/24 thì chỉnh:
```conf
options {
  directory "/var/cache/bind";
  allow-recursion { 172.31.0.0/24; };
  allow-query { 172.31.0.0/24; };
  allow-transfer { none; };
  dnssec-validation auto;
  listen-on-v6 { any; };
};
```

### DNSSEC
```conf
options {
    dnssec-validation auto;
    dnssec-enable yes;
};
```

## Monitoring và Logs

### Health Check
```bash
# Check DNS service status
systemctl status bind9

# Test DNS resolution
dig @localhost cloud.local
```

### Logs
```bash
# View DNS server logs
docker-compose logs -f dns-server

# Access DNS logs inside container
docker-compose exec dns-server tail -f /var/log/syslog
```

### DNS Statistics
```bash
# Get DNS statistics
docker-compose exec dns-server rndc stats
docker-compose exec dns-server cat /var/cache/bind/named.stats
```

## Performance Optimization

### Caching Configuration
```conf
options {
    max-cache-size 256m;
    max-cache-ttl 3600;
    max-ncache-ttl 3600;
};
```

### Query Optimization
```conf
options {
    recursive-clients 1000;
    max-recursion-depth 5;
    max-recursion-queries 100;
};
```

## Troubleshooting

### Common Issues

1. **DNS not resolving**: Check zone file syntax
2. **Permission denied**: Verify file permissions
3. **Service not starting**: Check configuration syntax
4. **Network issues**: Verify port 53 accessibility

### Debug Commands

```bash
# Check container status
docker-compose ps dns-server

# Check container logs
docker-compose logs -f dns-server

# Access container shell
docker-compose exec dns-server bash

# Check DNS configuration
docker-compose exec dns-server named-checkconf
docker-compose exec dns-server named-checkzone cloud.local /etc/bind/zones/db.cloud.local

# Restart DNS service
docker-compose restart dns-server
```

### Configuration Validation
```bash
# Validate main configuration
docker-compose exec dns-server named-checkconf /etc/bind/named.conf

# Validate zone files
docker-compose exec dns-server named-checkzone cloud.local /etc/bind/zones/db.cloud.local
docker-compose exec dns-server named-checkzone localhost /etc/bind/zones/db.localhost
```

## Backup và Restore

### Backup Configuration
```bash
# Backup DNS configuration
docker-compose exec dns-server tar -czf /backup/dns-config.tar.gz /etc/bind/

# Backup zone files
docker-compose exec dns-server cp -r /etc/bind/zones /backup/
```

### Restore Process
```bash
# Restore DNS configuration
docker-compose exec dns-server tar -xzf /backup/dns-config.tar.gz -C /

# Restart service after restore
docker-compose restart dns-server
```

## Production Considerations

### High Availability
- **Master-Slave setup**: Primary và secondary DNS
- **Load balancing**: Multiple DNS servers
- **Health monitoring**: DNS service monitoring
- **Failover**: Automatic failover

### Security Hardening
- **Access restrictions**: Limit query sources
- **Rate limiting**: Prevent DNS abuse
- **Logging**: Comprehensive audit logs
- **Updates**: Regular security updates

### Performance
- **Caching**: Optimize DNS caching
- **Recursion**: Limit recursive queries
- **Resources**: Adequate CPU và memory
- **Network**: Low-latency network
