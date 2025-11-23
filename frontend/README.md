frontend/README.md
# Web Frontend Server (`web-frontend-server`)

## 1. Giới thiệu
Service frontend cung cấp giao diện người dùng xây dựng bằng Next.js 14 + TypeScript + Tailwind CSS (xem [frontend/README.md](frontend/README.md) ban đầu). Docker image chạy trực tiếp Node.js (không reverse proxy Nginx trong thư mục này).

## 2. Vai trò trong kiến trúc MyMiniCloud
Đảm nhiệm phần UI (Next.js App Router) hiển thị blog/articles và các component (hero, header, footer). Giao tiếp nội bộ với các service khác qua hostname Docker (ví dụ backend, auth, storage) như được mô tả trong README gốc.

## 3. Công nghệ & Docker image sử dụng
- Runtime: Node.js 20 (image `node:20-alpine`)
- Framework: Next.js 14
- Ngôn ngữ: TypeScript
- Styling: Tailwind CSS
- Docker build multi-stage: cài deps, build (`npm run build`), chạy `npm start`
Tham khảo [frontend/Dockerfile](frontend/Dockerfile).

## 4. Cấu trúc thư mục
```
frontend/
├── app/
│   ├── (site)/                 # Nhóm các route chính
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Trang chủ
│   │   ├── blog/
│   │   │   ├── page.tsx        # Trang liệt kê blog
│   │   │   └── [id]/page.tsx   # Trang chi tiết blog
│   │   ├── articles/
│   │   │   ├── page.tsx        # Trang liệt kê articles
│   │   │   └── [id]/page.tsx   # Trang chi tiết article
│   ├── layout.tsx
│   ├── globals.css
├── components/                 # Header, Footer, Hero, Card...
├── lib/                        # Dữ liệu blog & articles (blog-data.tsx, article-data.tsx)
├── public/                     # Static assets (images, svg...)
├── Dockerfile
└── package.json
```


## 5. Cấu hình Nginx
Không tồn tại Nginx server block hoặc file cấu hình trong `frontend/`. Ứng dụng phục vụ nội dung qua Next.js dev/production server (Node.js). Do đó:
- `location /` và `location /blog/` không được cấu hình ở Nginx
- Không dùng `alias` hay root static của Nginx; static assets được Next.js phục vụ từ thư mục `public/`

## 6. Cách build & chạy
### Chạy độc lập (Docker)
```bash
docker build -t web-frontend-server ./frontend
docker run --rm -p 3000:3000 web-frontend-server
```
Port thực tế được expose trong [frontend/Dockerfile](frontend/Dockerfile) là `3000`.

### Chạy qua docker-compose
Dựa trên README gốc frontend (service thường được khai báo như):
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
```

## 7. Endpoint & port
- `http://localhost:3000/` – Trang chủ (App Router page.tsx)
- `http://localhost:3000/blog/` – Trang blog index (app/(site)/blog/page.tsx)
- `http://localhost:3000/articles/` – Trang articles

## 8. Hướng dẫn kiểm thử
```bash
# Kiểm tra header HTTP
curl -I http://localhost:3000/
curl -I http://localhost:3000/blog/
curl -I http://localhost:3000/articles/
```
Status mong đợi:
- 200 OK cho các route hợp lệ
- 404 Not Found cho slug không tồn tại (ví dụ `/blog/99999` nếu ID không định nghĩa trong `lib/blog-data.tsx`)

Truy cập bằng trình duyệt: mở các URL ở trên và kiểm tra nội dung render (cards, layout, styles Tailwind).

## 9. Phần mở rộng đã triển khai
Hiện tại nội dung blog/article được cung cấp qua các file dữ liệu:
- `lib/blog-data.tsx`
- `lib/article-data.tsx`
Không tồn tại các file tĩnh `blog1.html`, `blog2.html`, `blog3.html`. Để thêm/sửa bài viết:
1. Mở `lib/blog-data.tsx` hoặc `lib/article-data.tsx`
2. Thêm object mới (id, title, excerpt, image, date, author, tags...)
3. Rebuild container nếu chạy Docker: `docker-compose up -d --build frontend`

## 10. Troubleshooting
| Vấn đề | Nguyên nhân thực tế | Cách xử lý |
|--------|---------------------|-----------|
| 404 trên route blog/article | ID không tồn tại trong mảng dữ liệu | Kiểm tra `lib/blog-data.tsx` / `lib/article-data.tsx` |
| Static asset không load | Sai đường dẫn hoặc file chưa nằm trong `public/` | Đảm bảo đặt ảnh vào `public/` và dùng đường dẫn bắt đầu `/` |
| Layout không áp dụng CSS | Thiếu import `globals.css` hoặc build lỗi | Kiểm tra `app/globals.css` và logs build |
| Container không start | Lỗi build TypeScript hoặc thiếu deps | Xem `docker logs` và chạy `npm ci` lại |
| Sai port (8080 vs 3000) | Tài liệu/ cấu hình kỳ vọng Nginx khác thực tế | Dùng đúng port 3000 hoặc thêm reverse proxy ngoài thư mục này |
| Permission file (hiếm) | Mount volume host với quyền hạn chế | Chạy `docker run` không cần volume hoặc chỉnh quyền host |

Logs:
```bash
docker-compose logs -f frontend
```
Restart:
```bash
docker-compose restart frontend
```
