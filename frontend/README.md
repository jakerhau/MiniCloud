# Frontend Service

Frontend service được xây dựng bằng Next.js 14 với TypeScript, cung cấp giao diện người dùng cho hệ thống MiniCloud.

## Công nghệ sử dụng

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components
- **Build Tool**: Next.js built-in bundler

## Cấu trúc thư mục

```
frontend/
├── app/                    # Next.js App Router
│   ├── [id]/              # Dynamic route
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── blog-card.tsx       # Blog card component
│   ├── blog-grid.tsx       # Blog grid layout
│   ├── footer.tsx          # Footer component
│   ├── header.tsx          # Header component
│   └── hero.tsx            # Hero section
├── lib/                    # Utility libraries
│   └── blog-data.tsx       # Blog data management
├── public/                 # Static assets
│   ├── *.svg              # SVG icons
│   └── *.jpg              # Images
├── Dockerfile              # Docker configuration
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

## Các tính năng chính

### 1. Blog System
- Hiển thị danh sách blog posts
- Layout responsive với grid system
- Card-based design cho blog items

### 2. Responsive Design
- Mobile-first approach
- Tailwind CSS cho styling
- Responsive grid layouts

### 3. Component Architecture
- Modular component design
- Reusable UI components
- TypeScript type safety

## Cấu hình Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

```bash
NODE_ENV=production
```

## Ports

- **Development**: 3000
- **Production**: 3000 (mapped from Docker)

## API Endpoints

Frontend giao tiếp với các services khác:

- **Backend API**: `http://backend:8081` (internal)
- **Auth Service**: `http://auth:8080` (internal)
- **Storage Service**: `http://storage:9000` (internal)

## Development

### Chạy local development
```bash
cd frontend
npm install
npm run dev
```

### Build production
```bash
npm run build
npm start
```

### Linting và formatting
```bash
npm run lint
```

## Dependencies chính

- `next`: Next.js framework
- `react`: React library
- `typescript`: TypeScript support
- `tailwindcss`: CSS framework
- `@types/node`: Node.js types
- `@types/react`: React types

## Deployment

Service được deploy thông qua Docker Compose:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  image: 52200292/frontend:latest
  ports:
    - "3000:3000"
  networks:
    - cloud-net
  restart: unless-stopped
```

## Monitoring

- Health check endpoint: `http://localhost:3000/api/health`
- Logs: `docker-compose logs -f frontend`
- Metrics: Available through Next.js built-in monitoring

## Troubleshooting

### Common Issues

1. **Build fails**: Kiểm tra TypeScript errors
2. **Styling issues**: Verify Tailwind CSS configuration
3. **API connection**: Check backend service status

### Debug Commands

```bash
# Check container logs
docker-compose logs -f frontend

# Access container shell
docker-compose exec frontend sh

# Restart service
docker-compose restart frontend
```