# Database Service

Database service sử dụng MySQL 8.0 để lưu trữ dữ liệu cho hệ thống MiniCloud.

## Công nghệ sử dụng

- **Database**: MySQL 8.0
- **Storage**: Docker volumes
- **Initialization**: SQL scripts
- **Backup**: Docker volume backup

## Cấu hình Database

### MySQL Configuration
- **Version**: MySQL 8.0
- **Port**: 3306 (internal), 3307 (external)
- **Root Password**: root
- **Database Name**: Mini_Cloud
- **SSL Mode**: DISABLED (for development)

### Environment Variables
```bash
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=Mini_Cloud
MYSQL_ALLOW_EMPTY_PASSWORD=yes
MYSQL_SSL_MODE=DISABLED
```

## Cấu trúc thư mục

```
database/
├── init/                    # Database initialization scripts
│   └── 001_init.sql        # Initial schema và data
└── [backup/]               # Database backup files (optional)
```

## Database Schema

### Initialization Script
File `001_init.sql` chứa:
- Database schema creation
- Table definitions
- Initial data insertion
- Index creation
- User permissions

### Common Tables Structure
```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Docker Configuration

```yaml
database:
  image: mysql:8.0
  ports:
    - "3307:3306"
  networks:
    - cloud-net
  environment:
    - MYSQL_ROOT_PASSWORD=root
    - MYSQL_DATABASE=Mini_Cloud
    - MYSQL_ALLOW_EMPTY_PASSWORD=yes
    - MYSQL_SSL_MODE=DISABLED
  volumes:
    - ./database/init/001_init.sql:/docker-entrypoint-initdb.d/001_init.sql
    - mysql_data:/var/lib/mysql
  restart: unless-stopped
```

## Connection Information

### Internal (Docker Network)
- **Host**: database
- **Port**: 3306
- **Database**: Mini_Cloud
- **User**: root
- **Password**: root

### External (Host Machine)
- **Host**: localhost
- **Port**: 3307
- **Database**: Mini_Cloud
- **User**: root
- **Password**: root

## Database Operations

### Backup Database
```bash
# Create backup
docker-compose exec database mysqldump -u root -proot Mini_Cloud > backup.sql

# Restore from backup
docker-compose exec -i database mysql -u root -proot Mini_Cloud < backup.sql
```

### Access Database
```bash
# MySQL CLI access
docker-compose exec database mysql -u root -proot Mini_Cloud

# External access (from host)
mysql -h localhost -P 3307 -u root -proot Mini_Cloud
```

### Database Management
```bash
# Check database status
docker-compose exec database mysqladmin -u root -proot status

# Show databases
docker-compose exec database mysql -u root -proot -e "SHOW DATABASES;"

# Show tables
docker-compose exec database mysql -u root -proot Mini_Cloud -e "SHOW TABLES;"
```

## Performance Tuning

### MySQL Configuration
```sql
-- Optimize for development
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 32M;
```

### Index Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## Security

### User Management
```sql
-- Create application user
CREATE USER 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON Mini_Cloud.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

### Security Best Practices
- Use strong passwords
- Limit user permissions
- Enable SSL in production
- Regular security updates
- Monitor access logs

## Monitoring

### Health Checks
```bash
# Check MySQL status
docker-compose exec database mysqladmin -u root -proot ping

# Check database size
docker-compose exec database mysql -u root -proot -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables GROUP BY table_schema;"
```

### Logs
```bash
# View MySQL logs
docker-compose logs -f database

# Access MySQL error log
docker-compose exec database tail -f /var/log/mysql/error.log
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if MySQL service is running
2. **Access denied**: Verify username/password
3. **Database not found**: Check initialization script
4. **Slow queries**: Analyze query performance

### Debug Commands

```bash
# Check container status
docker-compose ps database

# Check container logs
docker-compose logs -f database

# Access container shell
docker-compose exec database bash

# Restart database
docker-compose restart database

# Reset database (WARNING: Data loss)
docker-compose down -v
docker-compose up -d database
```

## Backup Strategy

### Automated Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec database mysqldump -u root -proot Mini_Cloud > "backup_${DATE}.sql"
```

### Restore Process
```bash
# Restore from backup
docker-compose exec -i database mysql -u root -proot Mini_Cloud < backup_20231201_120000.sql
```

## Production Considerations

- Enable SSL/TLS encryption
- Use dedicated database user
- Implement connection pooling
- Set up replication for high availability
- Regular backup automation
- Performance monitoring
- Security hardening
