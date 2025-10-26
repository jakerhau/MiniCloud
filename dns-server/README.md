# DNS Server

DNS server sử dụng Bind9 để cung cấp DNS resolution cho các domain nội bộ trong hệ thống MiniCloud.

## Công nghệ sử dụng

- **DNS Server**: Bind9 (BIND)
- **Base Image**: Debian
- **Configuration**: named.conf
- **Zone Files**: Custom DNS zones

## Bind9 Configuration

### Basic Settings
- **Port**: 53 (UDP/TCP)
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
    - "53:53/udp"    # DNS UDP
    - "53:53/tcp"    # DNS TCP
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

### 3. cloud.local Zone (db.cloud.local)
```conf
$TTL 1H
@   IN  SOA ns.cloud.local. admin.cloud.local. (1 1H 15M 1W 1H)
    IN  NS   ns.cloud.local.

ns          IN  A   172.19.0.10
frontend    IN  A   172.19.0.11
backend     IN  A   172.19.0.12
auth        IN  A   172.19.0.13
database    IN  A   172.19.0.14
storage     IN  A   172.19.0.15
```

## DNS Resolution

### Internal Services
- **frontend.cloud.local** → 172.19.0.11
- **backend.cloud.local** → 172.19.0.12
- **auth.cloud.local** → 172.19.0.13
- **database.cloud.local** → 172.19.0.14
- **storage.cloud.local** → 172.19.0.15
- **ns.cloud.local** → 172.19.0.10

### localhost Resolution
- **localhost** → 127.0.0.1

## DNS Testing

### Command Line Testing
```bash
# Test DNS resolution
nslookup frontend.cloud.local localhost
nslookup backend.cloud.local localhost
nslookup auth.cloud.local localhost

# Test with dig
dig @localhost frontend.cloud.local
dig @localhost backend.cloud.local

# Test reverse lookup
nslookup 172.19.0.11 localhost
```

### From Docker Containers
```bash
# Test from other containers
docker-compose exec frontend nslookup backend.cloud.local
docker-compose exec backend nslookup database.cloud.local
```

## DNS Configuration Management

### Adding New Records
```conf
# Add new service to db.cloud.local
newservice    IN  A   172.19.0.16
```

### Adding New Zones
```conf
# Add new zone to named.conf
zone "newdomain.local" IN {
    type master;
    file "/etc/bind/zones/db.newdomain.local";
};
```

### CNAME Records
```conf
# Add CNAME records
www.frontend  IN  CNAME  frontend.cloud.local.
api.backend   IN  CNAME  backend.cloud.local.
```

## Security Configuration

### Access Control
```conf
options {
    allow-recursion { 172.19.0.0/16; };  # Only allow internal network
    allow-query { 172.19.0.0/16; };      # Restrict queries
    allow-transfer { none; };             # Disable zone transfers
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
