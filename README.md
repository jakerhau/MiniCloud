# MiniCloud - Microservices Architecture

MiniCloud là một hệ thống microservices được xây dựng với Docker và Docker Compose, bao gồm các dịch vụ chính như frontend, backend, database, authentication, storage, và DNS.

## Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
│   Port: 3000    │    │   Port: 8081    │    │   Port: 3307    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth          │    │   Storage       │    │   DNS Server    │
│   (Keycloak)    │    │   (MinIO)       │    │   (Bind9)       │
│   Port: 8082    │    │   Port: 9000    │    │   Port: 53      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```


## Cách chạy Docker

### 1. Clone repository
```bash
git clone <repository-url>
cd MiniCloud
```

### 2. Khởi động tất cả services
```bash
docker-compose up -d
```

### 3. Kiểm tra trạng thái services
```bash
docker-compose ps
```

### 4. Xem logs của tất cả services
```bash
docker-compose logs -f
```

### 5. Xem logs của service cụ thể
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f database
docker-compose logs -f auth
docker-compose logs -f storage-server
docker-compose logs -f dns-server
```

### 6. Dừng tất cả services
```bash
docker-compose down
```

### 7. Dừng và xóa volumes (cẩn thận - sẽ mất dữ liệu)
```bash
docker-compose down -v
```

### 8. Rebuild và khởi động lại
```bash
docker-compose up -d --build
```

## Truy cập các dịch vụ

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Giao diện người dùng |
| Backend API | http://localhost:8081 | API server |
| Database | localhost:3307 | MySQL database |
| Auth (Keycloak) | http://localhost:8082 | Authentication server |
| Storage (MinIO) | http://localhost:9000 | Object storage |
| Storage Console | http://localhost:9001 | MinIO console |
| Monitoring | http://localhost:9090 | Monitoring Node Exporter + Prometheus |
| Logging (Granafa) | http://localhost:3120 | Grafana Dashboard  |

## DNS Resolution

Hệ thống sử dụng DNS server để resolve các domain nội bộ:

- `frontend.cloud.local` → Frontend service
- `backend.cloud.local` → Backend service  
- `auth.cloud.local` → Auth service
- `database.cloud.local` → Database service
- `storage.cloud.local` → Storage service

## Troubleshooting

### Kiểm tra network
```bash
docker network ls
docker network inspect minicloud_cloud-net
```

### Kiểm tra container logs
```bash
docker-compose logs [service-name]
```

### Restart service cụ thể
```bash
docker-compose restart [service-name]
```


## Cấu trúc thư mục

```
MiniCloud/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js backend API
├── database/          # MySQL database initialization
├── auth/              # Keycloak authentication
├── storage-server/    # MinIO object storage
├── dns-server/        # Bind9 DNS server
├── load_balancer/     # Nginx load balancer
├── logging/           # Centralized logging
├── monitoring/        # System monitoring
└── docker-compose.yml # Docker Compose configuration
```

## Phát triển

Để phát triển và debug:

1. Sửa đổi code trong các thư mục tương ứng
2. Rebuild service: `docker-compose up -d --build [service-name]`
3. Xem logs: `docker-compose logs -f [service-name]`

## Lưu ý

- Database data được lưu trong volume Docker
- Auth data được lưu trong `./auth/data/`
- Storage data được lưu trong `./storage-server/data/`
- DNS zones được cấu hình trong `./dns-server/zones/`