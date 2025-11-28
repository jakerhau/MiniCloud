# MiniCloud - Microservices Architecture

MiniCloud là bản demo kiến trúc microservices chạy bằng Docker Compose. Bộ dịch vụ gồm Nginx load balancer, 2 frontend Next.js, backend Node.js (JWT qua Keycloak), MySQL, MinIO, Bind9 DNS, Prometheus + Node Exporter và Grafana.

## Kiến trúc hệ thống

```
                [Client]
                    |
             http://localhost:80
                    |
                 [proxy]
      +------------+-----------+----------------+
      |            |           |                |
[web-frontend-1] [web-frontend-2]      [backend:8081]
(port 3001)      (port 3002)             |
                                         |
                               [MySQL 3306 -> host 3307]
                                         |
                     [Keycloak host 8082 -> container 8080 (/auth)]
                                         |
                        [MinIO API 9000 / Console 9001]
                                         |
            [Bind9 DNS 1053]   [Prometheus 9090 + NodeExporter 9100]
                                         |
                                  [Grafana 3120]
```

- `proxy` (Nginx) cân bằng tới 2 frontend, route `/api` và `/student` đến backend, `/auth` đến Keycloak, phục vụ blog tĩnh từ `frontend/public/blog` tại `/blog-static/`.
- Network `cloud-net` dùng IP cố định 172.31.0.x; các service gọi nhau qua service name, host truy cập qua port mapping.
- Backend nhận JWT RS256 từ issuer `http://auth:8080/auth/realms/master`, swagger tại `/api-docs`; bắt buộc khai báo env `OIDC_ISSUER`, `OIDC_AUDIENCE`.
- MinIO chạy single node, mount dữ liệu tại `./storage-server/data`; env `STORAGE_PATH` hiện chưa có tác dụng vì ENTRYPOINT đang khóa đường dẫn `/data`.
- Prometheus scrape node-exporter, chính nó và frontend `/api/metrics`; Grafana dùng datasource Prometheus đã seed sẵn trong `logging/grafana-data/grafana.db` (dashboard sẵn: `Node Exporter Full`, `System Health of 52200205`). Thư mục `logging/dashboards` chưa được mount trong compose; muốn nạp JSON mới thì copy vào `logging/grafana-data/dashboards/` hoặc thêm volume mount từ thư mục đó.
- Bind9 phục vụ zone `cloud.local` cho các hostname dịch vụ.

## Cách chạy Docker

### 1. Clone repository
```bash
git clone <github.com/jakerhau/MiniCloud.git>
cd MiniCloud
````

### 2. Khởi động tất cả services

```bash
docker compose up -d --build
```

### 3. Kiểm tra trạng thái services

```bash
docker compose ps
```

### 4. Xem logs tất cả services

```bash
docker compose logs -f
```

### 5. Xem logs từng service

```bash
docker compose logs -f proxy
docker compose logs -f web-frontend-server1
docker compose logs -f web-frontend-server2
docker compose logs -f backend
docker compose logs -f database
docker compose logs -f auth
docker compose logs -f storage-server
docker compose logs -f dns-server
docker compose logs -f monitoring-prometheus-server
docker compose logs -f monitoring-node-exporter-server
docker compose logs -f logging-server
```

### 6. Dừng tất cả services

```bash
docker compose down
```

### 7. Dừng và xóa volumes (sẽ mất dữ liệu)

```bash
docker compose down -v
```

### 8. Rebuild và khởi động lại một service

```bash
docker compose up -d --build backend
```

## Truy cập các dịch vụ

| Service                 | Endpoint                                                       | Ghi chú                                                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Load Balancer (proxy)   | [http://localhost](http://localhost)                           | Round robin 2 frontend, route `/api`/`/student` -> backend, `/auth` -> Keycloak, blog tĩnh `/blog-static/*`                                                                                                        |
| Frontend 1              | [http://localhost:3001](http://localhost:3001)                 | Next.js instance 1 (truy cập trực tiếp, bỏ qua load balancer)                                                                                                                                                      |
| Frontend 2              | [http://localhost:3002](http://localhost:3002)                 | Next.js instance 2                                                                                                                                                                                                 |
| Backend API             | [http://localhost:8081](http://localhost:8081)                 | Swagger UI `/api-docs`, `/secure` cần JWT audience `backend`                                                                                                                                                       |
| Database (MySQL)        | 127.0.0.1:3307                                                 | DB `Mini_Cloud`, user `root` / `root`; chưa gắn volume data (xóa container sẽ mất data); chỉ khởi tạo schema/demo từ `database/init/001_init.sql`, backend chưa kết nối                                            |
| Auth (Keycloak)         | [http://localhost:8082/auth](http://localhost:8082/auth)       | Admin `admin` / `admin`, realm `master`, issuer public `http://localhost:8082/auth/realms/master` (nội bộ: `http://auth:8080/auth/realms/master`)                                                                  |
| Storage API (MinIO)     | [http://localhost:9000](http://localhost:9000)                 | Access key `admin123`, secret `strongpass123`                                                                                                                                                                      |
| Storage Console         | [http://localhost:9001](http://localhost:9001)                 | Đăng nhập bằng admin123 / strongpass123                                                                                                                                                                            |
| DNS                     | 127.0.0.1#1053                                                 | UDP/TCP; bản ghi `frontend-1/2`, `backend`, `auth`, `database`, `storage`, `ns`                                                                                                                                    |
| Monitoring (Prometheus) | [http://localhost:9090](http://localhost:9090)                 | Targets: prometheus, node-exporter, frontend (`/api/metrics`)                                                                                                                                                      |
| Node Exporter           | [http://localhost:9100/metrics](http://localhost:9100/metrics) | Host metrics exporter                                                                                                                                                                                              |
| Logging (Grafana)       | [http://localhost:3120](http://localhost:3120)                 | Login `admin` / `admin`, datasource Prometheus + dashboards `Node Exporter Full`/`System Health of 52200205` nằm sẵn trong volume `logging/grafana-data` (thư mục `logging/dashboards` chưa được mount từ compose) |

## DNS Resolution

Bind9 listen port 53 trong container, publish ra host port `1053`. Zone `cloud.local` gồm:

* `frontend-1.cloud.local` -> 172.31.0.2
* `frontend-2.cloud.local` -> 172.31.0.3
* `backend.cloud.local` -> 172.31.0.7
* `auth.cloud.local` -> 172.31.0.6
* `database.cloud.local` -> 172.31.0.10
* `storage.cloud.local` -> 172.31.0.4
* `ns.cloud.local` -> 172.31.0.8

Kiểm tra DNS từ host (nhớ chỉ định port 1053):

```bash
dig @127.0.0.1 -p 1053 frontend-1.cloud.local
nslookup backend.cloud.local 127.0.0.1#1053
```

## Troubleshooting

### Kiểm tra network

```bash
docker network ls
docker network inspect minicloud_cloud-net
```

### Kiểm tra container logs

```bash
docker compose logs [service-name]
```

### Restart service

```bash
docker compose restart [service-name]
```

### Các lỗi thường gặp

* Port 80/3001/3002/8081/8082/9000/9001/9090/9100/3120 bị chiếm bởi ứng dụng khác hoặc đổi port mapping.
* MySQL chưa gắn volume `/var/lib/mysql`; muốn giữ data cần bổ sung volume.
* MinIO đang mount `/data`; env `STORAGE_PATH` không có hiệu lực nếu không sửa ENTRYPOINT.
* DNS trả NXDOMAIN nếu quên `-p 1053` hoặc service `dns-server` chưa chạy.
* `/secure` trả 401 khi token sai audience/issuer; lấy token từ Keycloak realm `master` và đảm bảo `OIDC_ISSUER`/`OIDC_AUDIENCE` đúng.
* Chưa có script test .ps1; dùng các lệnh dig/nslookup/curl ở các phần trên để kiểm tra nhanh.

## Cấu trúc thư mục

```
MiniCloud/
  auth/              # Dữ liệu Keycloak (mounted /opt/keycloak/data)
  backend/           # Node.js API + swagger
  database/          # SQL init cho MySQL
  dns-server/        # Bind9 config & zone files
  frontend/          # Next.js app (build cho 2 instance)
  load_balancer/     # Nginx proxy cấu hình
  logging/           # Grafana provisioning, dashboards và dữ liệu
  monitoring/        # Prometheus config
  storage-server/    # MinIO image & data
  docker-compose.yml # Docker Compose configuration
  README.md
  package.json
  package-lock.json
  .gitignore
```

## Phát triển

1. Sửa đổi code trong thư mục dịch vụ tương ứng.
2. Rebuild service: `docker compose up -d --build <service-name>`.
3. Xem logs: `docker compose logs -f <service-name>`.
4. Backend cần dùng `OIDC_ISSUER`/`OIDC_AUDIENCE` (hardcode port 8081); frontend expose metrics tại `/api/metrics` cho Prometheus.

## Lưu ý

* Keycloak admin mặc định `admin/admin`; đổi mật khẩu ngay nếu máy có internet.
* MinIO creds `admin123/strongpass123`; thay bằng giá trị mạnh hơn khi chạy thật.
* Dữ liệu: Keycloak trong `./auth/data/`, MinIO trong `./storage-server/data/`, Grafana trong `./logging/grafana-data/`. MySQL chưa mount volume nên xóa container sẽ mất data.
* Grafana được seed sẵn datasource Prometheus + dashboards trong `logging/grafana-data/grafana.db`; thư mục `logging/dashboards` chỉ là nơi lưu JSON mẫu, không tự động mount.
* Backend demo chưa kết nối MySQL hay MinIO (chỉ đọc `students.json` và kiểm JWT), nên DB/MinIO chỉ là các dịch vụ để phòng.
* Network `cloud-net` dùng 172.31.0.0/24; tránh trùng lặp với mạng đang có trên host.
* Muốn đổi đường dẫn dữ liệu MinIO cần sửa ENTRYPOINT hoặc bỏ env `STORAGE_PATH` đang không được sử dụng.

```

