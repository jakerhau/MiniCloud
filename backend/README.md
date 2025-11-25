# Backend Service

Backend tối giản cung cấp một vài API công khai và bảo vệ JWT, đồng thời hiển thị tài liệu Swagger UI với OAuth2/PKCE. Không có kết nối database hay CRUD phức tạp – dữ liệu duy nhất được trả về từ file tĩnh `students.json`.

## Công Nghệ
- Runtime: Node.js 20 (alpine image)
- Framework: Express 4
- Auth: Keycloak (OIDC) qua `express-jwt` + `jwks-rsa`
- API Docs: `swagger-ui-express` phục vụ `openapi.json`
- Kiểu module: ES Modules (`"type": "module"`)

## Thư Mục
```
backend/
├── index.js        # Entry + cấu hình JWT + routes
├── students.json   # Dữ liệu mẫu trả về ở /api/student
├── openapi.json    # OpenAPI spec dùng cho Swagger UI
├── Dockerfile      # Build image Node 20 alpine
└── package.json    # Dependencies & scripts
```

## Environment Variables Bắt Buộc
| Tên | Bắt buộc | Mô tả |
|-----|----------|------|
| `OIDC_ISSUER` | Yes | Issuer Keycloak nội bộ, ví dụ: `http://auth:8080/auth/realms/master` |
| `OIDC_AUDIENCE` | Yes | Audience gán cho client/backend (ví dụ `backend`) |
| `PORT` | No | Không dùng trong code (mặc định hardcode 8081) |

Ứng dụng sẽ thoát ngay nếu thiếu `OIDC_ISSUER` hoặc `OIDC_AUDIENCE`. Từ `OIDC_ISSUER` nội bộ suy ra JWKS URI: `ISSUER + /protocol/openid-connect/certs`.

Lưu ý: Bên ngoài container (host) Keycloak truy cập tại `http://localhost:8082/auth/...`; bên trong network dùng hostname `auth:8080`.

## Dockerfile (thực tế)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```
Port 8081 được publish trong `docker-compose.yml`.

## Phụ Thuộc Chính
- express
- express-jwt
- jwks-rsa
- swagger-ui-express
- (Node core) fs, path

Không sử dụng: mysql2, cors, helmet, dotenv – những thư viện này xuất hiện trong README cũ nhưng không có trong `package.json` hay mã nguồn.

## Routes & Bảo Vệ
| Route | Phương thức | Bảo vệ JWT | Mô tả |
|-------|-------------|------------|-------|
| `/hello` | GET | Public | Trả về JSON "Hello, world!" |
| `/api/hello` | GET | Public | Alias tương tự `/hello` |
| `/api/student` | GET | Public | Đọc và trả về nội dung `students.json` |
| `/secure` | GET | Protected | Yêu cầu access token hợp lệ (RS256) |
| `/api-docs` | GET (UI) | Public | Swagger UI + OAuth2 PKCE |

Whitelist trong middleware còn chứa `/health` nhưng hiện tại CHƯA có route `/health` được implement (ghi chú để tránh nhầm lẫn).

## Swagger UI / OAuth2
Swagger phục vụ tại `/api-docs`. File `openapi.json` định nghĩa security scheme OAuth2 authorizationCode. Cấu hình UI dùng:
- `clientId: swagger-ui`
- `usePkceWithAuthorizationCodeGrant: true`

Đường dẫn auth/token trong `openapi.json` dùng host-port ngoài (`localhost:8082`) để chạy thử từ browser.

## Luồng Xác Thực Tối Giản
1. Người dùng đăng nhập Keycloak và nhận Access Token (RS256).
2. Gửi request đến `/secure` kèm header `Authorization: Bearer <token>`.
3. Middleware kiểm tra: giải quyết JWKS, khớp audience (`OIDC_AUDIENCE`), issuer, và thuật toán.
4. Payload hợp lệ => trả JSON gồm các claim (`preferred_username`, `email`, ...).

## Khởi Chạy & Phát Triển
```bash
cd backend
npm install        # lần đầu nếu cần
npm start          # chạy index.js
```
Không có bước build riêng; mã ES Module chạy trực tiếp bằng Node 20.

## Logging / Quan Sát
- Startup in ra cấu hình OIDC + JWKS URI.
- Lỗi JWT được xử lý trong middleware `jwtErrorHandler` (trả JSON với chi tiết).
- Dữ liệu sinh viên đọc thất bại sẽ log lỗi file / parse.

## Troubleshooting
| Vấn đề | Nguyên nhân thường gặp | Cách xử lý |
|--------|------------------------|-----------|
| App thoát ngay khi start | Thiếu env OIDC_ISSUER / OIDC_AUDIENCE | Kiểm tra biến trong `docker-compose.yml` |
| 401 Unauthorized ở `/secure` | Token sai audience / hết hạn / issuer khác | Lấy lại token từ đúng realm, kiểm tra `aud` claim |
| Swagger không login được | Sai clientId hoặc realm URL | Đảm bảo realm path `/auth/realms/master` đúng và client `swagger-ui` tồn tại |
| Không thấy dữ liệu sinh viên | Lỗi đọc / parse `students.json` | Kiểm tra định dạng JSON hợp lệ (UTF-8, không comment) |

## Những Gì KHÔNG Có
- Không kết nối MySQL hoặc ORM.
- Không CRUD người dùng / lớp / môn học.
- Không caching, rate limiting, load balancing nội bộ.
- Không health endpoint (dù tên `/health` được whitelist sẵn). Có thể bổ sung sau nếu cần.

## Gợi Ý Mở Rộng (Tùy Chọn)
- Thêm `/health` để Prometheus có thể probe.
- Bọc đọc file `students.json` bằng cache in-memory nếu tần suất cao.
- Cho phép PORT cấu hình động thay vì hardcode.

## Tóm Tắt
README đã được rút gọn để phản ánh CHÍNH XÁC mã nguồn hiện tại: service chỉ cung cấp vài endpoint đơn giản, xác thực JWT qua Keycloak, trả dữ liệu tĩnh từ file và hiển thị tài liệu Swagger. Không còn các phần thừa về database, CRUD, scaling.

