# MiniCloud - Microservices Architecture

MiniCloud la ban demo kien truc microservices chay bang Docker Compose. Bo dich vu gom Nginx load balancer, 2 frontend Next.js, backend Node.js (JWT qua Keycloak), MySQL, MinIO, Bind9 DNS, Prometheus + Node Exporter va Grafana.

## Kien truc he thong

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
            [Bind9 DNS 53]   [Prometheus 9090 + NodeExporter 9100]
                                         |
                                  [Grafana 3120]
```

- `proxy` (Nginx) can bang toi 2 frontend, route `/api` va `/student` den backend, `/auth` den Keycloak, phuc vu blog tinh tu `frontend/public/blog` tai `/blog-static/`.
- Network `cloud-net` dung IP co dinh 172.31.0.x; cac service goi nhau qua service name, host truy cap qua port mapping.
- Backend nhan JWT RS256 tu issuer `http://auth:8080/auth/realms/master`, swagger tai `/api-docs`; bat buoc khai bao env `OIDC_ISSUER`, `OIDC_AUDIENCE`.
- MinIO chay single node, mount du lieu tai `./storage-server/data`; env `STORAGE_PATH` hien chua co tac dung vi ENTRYPOINT dang khoa duong dan `/data`.
- Prometheus scrape node-exporter, chinh no va frontend `/api/metrics`; Grafana dung datasource Prometheus da seed san trong `logging/grafana-data/grafana.db` (dashboard san: `Node Exporter Full`, `System Health of 52200205`). Thu muc `logging/dashboards` chua duoc mount trong compose; muon nap JSON moi thi copy vao `logging/grafana-data/dashboards/` hoac them volume mount tu thu muc do.
- Bind9 phuc vu zone `cloud.local` cho cac hostname dich vu.

## Cach chay Docker

### 1. Clone repository
```bash
git clone <repository-url>
cd MiniCloud
```

### 2. Khoi dong tat ca services
```bash
docker compose up -d --build
```

### 3. Kiem tra trang thai services
```bash
docker compose ps
```

### 4. Xem logs tat ca services
```bash
docker compose logs -f
```

### 5. Xem logs tung service
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

### 6. Dung tat ca services
```bash
docker compose down
```

### 7. Dung va xoa volumes (se mat du lieu)
```bash
docker compose down -v
```

### 8. Rebuild va khoi dong lai mot service
```bash
docker compose up -d --build backend
```

## Truy cap cac dich vu

| Service | Endpoint | Ghi chu |
|---------|----------|---------|
| Load Balancer (proxy) | http://localhost | Round robin 2 frontend, route `/api`/`/student` -> backend, `/auth` -> Keycloak, blog tinh `/blog-static/*` |
| Frontend 1 | http://localhost:3001 | Next.js instance 1 (truy cap truc tiep, bo qua load balancer) |
| Frontend 2 | http://localhost:3002 | Next.js instance 2 |
| Backend API | http://localhost:8081 | Swagger UI `/api-docs`, `/secure` can JWT audience `backend` |
| Database (MySQL) | 127.0.0.1:3307 | DB `Mini_Cloud`, user `root` / `root`; chua gan volume data (xoa container se mat data); chi khoi tao schema/demo tu `database/init/001_init.sql`, backend chua ket noi |
| Auth (Keycloak) | http://localhost:8082/auth | Admin `admin` / `admin`, realm `master`, issuer public `http://localhost:8082/auth/realms/master` (noi bo: `http://auth:8080/auth/realms/master`) |
| Storage API (MinIO) | http://localhost:9000 | Access key `admin123`, secret `strongpass123` |
| Storage Console | http://localhost:9001 | Dang nhap bang admin123 / strongpass123 |
| DNS | 127.0.0.1:53 | UDP/TCP; ban ghi `frontend-1/2`, `backend`, `auth`, `database`, `storage`, `ns`, `minio`, `keycloak` |
| Monitoring (Prometheus) | http://localhost:9090 | Targets: prometheus, node-exporter, frontend (`/api/metrics`) |
| Node Exporter | http://localhost:9100/metrics | Host metrics exporter |
| Logging (Grafana) | http://localhost:3120 | Login `admin` / `admin`, datasource Prometheus + dashboards `Node Exporter Full`/`System Health of 52200205` nam san trong volume `logging/grafana-data` (thu muc `logging/dashboards` chua duoc mount tu compose) |

## DNS Resolution

Bind9 listen port 53 trong container, publish ra host port `53` (port mặc định DNS). Zone `cloud.local` gom:

- `frontend-1.cloud.local` -> 172.31.0.2
- `frontend-2.cloud.local` -> 172.31.0.3
- `backend.cloud.local` -> 172.31.0.7
- `auth.cloud.local` -> 172.31.0.6
- `database.cloud.local` -> 172.31.0.10
- `storage.cloud.local` -> 172.31.0.4
- `ns.cloud.local` -> 172.31.0.8

Kiem tra DNS tu host (port 53 la mac dinh):
```bash
dig @127.0.0.1 frontend-1.cloud.local
nslookup backend.cloud.local 127.0.0.1
```

## Troubleshooting

### Kiem tra network
```bash
docker network ls
docker network inspect minicloud_cloud-net
```

### Kiem tra container logs
```bash
docker compose logs [service-name]
```

### Restart service
```bash
docker compose restart [service-name]
```

### Cac loi thuong gap
- Port 80/3001/3002/8081/8082/9000/9001/9090/9100/3120 bi chiem boi ung dung khac hoac doi port mapping.
- MySQL chua gan volume `/var/lib/mysql`; muon giu data can bo sung volume.
- MinIO dang mount `/data`; env `STORAGE_PATH` khong co hieu luc neu khong sua ENTRYPOINT.
- DNS tra NXDOMAIN neu service `dns-server` chua chay hoac host khong dung DNS server tai `127.0.0.1:53`.
- `/secure` tra 401 khi token sai audience/issuer; lay token tu Keycloak realm `master` va dam bao `OIDC_ISSUER`/`OIDC_AUDIENCE` dung.
- Chua co script test .ps1; dung cac lenh dig/nslookup/curl o cac phan tren de kiem tra nhanh.

## Cau truc thu muc

```
MiniCloud/
  auth/              # Du lieu Keycloak (mounted /opt/keycloak/data)
  backend/           # Node.js API + swagger
  database/          # SQL init cho MySQL
  dns-server/        # Bind9 config & zone files
  frontend/          # Next.js app (build cho 2 instance)
  load_balancer/     # Nginx proxy cau hinh
  logging/           # Grafana provisioning, dashboards va du lieu
  monitoring/        # Prometheus config
  storage-server/    # MinIO image & data
  docker-compose.yml # Docker Compose configuration
  README.md
  package.json
  package-lock.json
  .gitignore
```

## Phat trien

1. Sua doi code trong thu muc dich vu tuong ung.
2. Rebuild service: `docker compose up -d --build <service-name>`.
3. Xem logs: `docker compose logs -f <service-name>`.
4. Backend can dung `OIDC_ISSUER`/`OIDC_AUDIENCE` (hardcode port 8081); frontend expose metrics tai `/api/metrics` cho Prometheus.

## Luu y

- Keycloak admin mac dinh `admin/admin`; doi mat khau ngay neu may co internet.
- MinIO creds `admin123/strongpass123`; thay bang gia tri manh hon khi chay that.
- Du lieu: Keycloak trong `./auth/data/`, MinIO trong `./storage-server/data/`, Grafana trong `./logging/grafana-data/`. MySQL chua mount volume nen xoa container se mat data.
- Grafana duoc seed san datasource Prometheus + dashboards trong `logging/grafana-data/grafana.db`; thu muc `logging/dashboards` chi la noi luu JSON mau, khong tu dong mount.
- Backend demo chua ket noi MySQL hay MinIO (chi doc `students.json` va kiem JWT), nen DB/MinIO chi la cac dich vu de phong.
- Network `cloud-net` dung 172.31.0.0/24; tranh trung lap voi mang dang co tren host.
- Muon doi duong dan du lieu MinIO can sua ENTRYPOINT hoac bo env `STORAGE_PATH` dang khong duoc su dung.
