# Load Balancer / Proxy (Nginx)

Thư mục `load_balancer/` chứa image Nginx tuỳ biến dùng để cân bằng tải cho hai instance frontend và forward các route API/Keycloak. Service tương ứng trong `docker-compose.yml` là `proxy`.

## 1. Thành phần

```
load_balancer/
├── Dockerfile     # Dựa trên nginx:stable + công cụ debug mạng
├── nginx.conf     # Cấu hình upstream, location và alias
└── README.md
```

### Dockerfile
-
```dockerfile
FROM nginx:stable
RUN apt-get update && apt-get install -y iputils-ping dnsutils curl && rm -rf /var/lib/apt/lists/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
```

## 2. Luồng chính trong `nginx.conf`

- `upstream frontend_pool` gồm `web-frontend-server1:3000` và `web-frontend-server2:3000` (round robin).
- `location /` proxy mọi request (bao gồm Next.js routes) tới upstream.
- `location /api/` và `location /student/` forward đến backend và THÊM header `Authorization` (giữ JWT/OIDC). `location /api-docs` hiện KHÔNG set header này (Swagger UI không cần token mặc định; nếu muốn truyền Authorization cho try-it-out có thể bổ sung thêm dòng `proxy_set_header Authorization $http_authorization;`).
- `location /student/` map trực tiếp tới endpoint `/api/student` của backend (giữ để demo route legacy).
- `location /auth/` forward Keycloak (`auth:8080`), đồng thời có rule redirect `/auth` → `/auth/`.
- `location /blog-static/` sử dụng `alias /var/www/blog-static/` để phục vụ các file HTML tĩnh của frontend mà không phải đi qua Next.js.
- Bật thêm `gzip` và header `X-Upstream-Server` để dễ debug.

## 3. Khai báo docker-compose 

```yaml
proxy:
  build:
    context: ./load_balancer
    dockerfile: Dockerfile
  image: nginx:stable              # Tag áp dụng cho image build ra
  ports:
    - "80:80"
  depends_on:
    - web-frontend-server1
    - web-frontend-server2
    - backend
    - auth
  volumes:
    - ./load_balancer/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - ./frontend/public/blog:/var/www/blog-static:ro
  networks:
    cloud-net:
      ipv4_address: 172.31.0.12
  restart: unless-stopped
```

Mount thư mục `frontend/public/blog` đảm bảo các file HTML (`blog1.html` …) có thể truy cập qua `http://localhost/blog-static/blog1.html` ngay cả khi frontend bị down.

## 4. Kiểm thử nhanh

```powershell
# Truy cập thông qua proxy thay vì trực tiếp từng container
Invoke-WebRequest http://localhost/ | Select-Object -ExpandProperty StatusCode
Invoke-WebRequest http://localhost/api/hello
Invoke-WebRequest http://localhost/blog-static/blog1.html

# Kiểm tra header upstream
curl -I http://localhost/ -H "Host: localhost" | Select-String "X-Upstream-Server"
```

Nếu backend yêu cầu JWT ở các endpoint trong `/api/` hoặc route `/student/`, gửi thêm header `Authorization: Bearer <token>`; Nginx forward nguyên xi header này cho hai location đó. Swagger UI `/api-docs` hiện không forward header Authorization (có thể bổ sung nếu cần thử các yêu cầu bảo vệ trực tiếp từ giao diện).

## 5. Troubleshooting

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| Proxy trả 502 Bad Gateway | Container backend/frontend/auth chưa lên hoặc DNS không resolve | `docker compose ps` để chắc service đang chạy, kiểm tra `dns-server` nếu sử dụng hostname khác |
| Static blog 404 | Volume `./frontend/public/blog` chưa mount | Kiểm tra dòng volumes của service `proxy` |
| CSS/JS bị cache | Nginx không bật cache, nhưng trình duyệt có thể giữ. Dùng Ctrl+F5 hoặc thêm header `Cache-Control` nếu cần |

Logs: `docker compose logs -f proxy`

Restart: `docker compose restart proxy`
