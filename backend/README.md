# Backend Service

Backend service được xây dựng bằng Node.js, cung cấp RESTful API cho hệ thống MiniCloud.

## Công nghệ sử dụng

- **Runtime**: Node.js
- **Language**: JavaScript
- **Framework**: Express.js (assumed)
- **Database**: MySQL
- **Authentication**: Keycloak integration

## Cấu trúc thư mục

```
backend/
├── index.js              # Main application entry point
├── package.json           # Dependencies và scripts
├── Dockerfile            # Docker configuration
└── [other files]         # Additional backend files
```

## Các tính năng chính

### 1. RESTful API
- CRUD operations cho các entities
- RESTful endpoint design
- JSON response format

### 2. Database Integration
- MySQL database connection
- Database query operations
- Data validation

### 3. Authentication
- Keycloak integration
- JWT token validation
- User session management

### 4. Error Handling
- Centralized error handling
- HTTP status codes
- Error logging

## Cấu hình Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8081
CMD ["node", "index.js"]
```

## Environment Variables

```bash
NODE_ENV=production
DB_HOST=database
DB_PORT=3306
DB_NAME=Mini_Cloud
DB_USER=root
DB_PASSWORD=root
KEYCLOAK_URL=http://auth:8080
```

## Ports

- **Development**: 8081
- **Production**: 8081 (mapped from Docker)

## API Endpoints

### Base URL
```
http://localhost:8081/api/v1
```

### Common Endpoints
- `GET /health` - Health check
- `GET /api/v1/users` - Get users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## Database Schema

Kết nối với MySQL database:
- **Host**: database (internal Docker network)
- **Port**: 3306
- **Database**: Mini_Cloud
- **User**: root
- **Password**: root

## Dependencies chính

- `express`: Web framework
- `mysql2`: MySQL client
- `cors`: CORS middleware
- `helmet`: Security middleware
- `dotenv`: Environment variables
- `jsonwebtoken`: JWT handling

## Development

### Chạy local development
```bash
cd backend
npm install
npm run dev
```

### Build production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## Deployment

Service được deploy thông qua Docker Compose:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  image: 52200292/backend:latest
  ports:
    - "8081:8081"
  networks:
    - cloud-net
```

## Security

### Authentication Flow
1. User login qua Keycloak
2. Receive JWT token
3. Include token trong API requests
4. Validate token ở backend

### Security Headers
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection prevention

## Monitoring

- Health check endpoint: `http://localhost:8081/health`
- Logs: `docker-compose logs -f backend`
- Database connection monitoring
- API response time tracking

## Troubleshooting

### Common Issues

1. **Database connection fails**: Check MySQL service status
2. **Authentication errors**: Verify Keycloak configuration
3. **CORS issues**: Check frontend-backend communication

### Debug Commands

```bash
# Check container logs
docker-compose logs -f backend

# Access container shell
docker-compose exec backend sh

# Check database connection
docker-compose exec backend node -e "console.log('DB connection test')"

# Restart service
docker-compose restart backend
```

## Performance

### Optimization
- Connection pooling cho database
- Response caching
- Request rate limiting
- Memory usage monitoring

### Scaling
- Horizontal scaling với load balancer
- Database read replicas
- Microservice decomposition
