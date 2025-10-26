# Authentication Service

Authentication service sử dụng Keycloak để cung cấp identity và access management cho hệ thống MiniCloud.

## Công nghệ sử dụng

- **Identity Provider**: Keycloak
- **Protocols**: OpenID Connect, OAuth 2.0, SAML
- **Database**: H2 (embedded)
- **Storage**: Docker volumes

## Keycloak Configuration

### Basic Settings
- **Version**: Latest Keycloak
- **Port**: 8080 (internal), 8082 (external)
- **Admin User**: admin
- **Admin Password**: admin
- **Hostname**: localhost
- **Mode**: Development mode

### Environment Variables
```bash
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_HOSTNAME=localhost
```

## Cấu trúc thư mục

```
auth/
├── data/                    # Keycloak data persistence
│   ├── h2/                 # H2 database files
│   │   ├── keycloakdb.mv.db
│   │   └── keycloakdb.trace.db
│   └── transaction-logs/   # Transaction logs
│       └── ShadowNoFileLockStore/
│           └── defaultStore/
└── README.md               # This file
```

## Docker Configuration

```yaml
auth:
  image: keycloak/keycloak:latest
  ports:
    - "8082:8080"
  networks:
    - cloud-net
  environment:
    - KEYCLOAK_ADMIN=admin
    - KEYCLOAK_ADMIN_PASSWORD=admin
    - KEYCLOAK_HOSTNAME=localhost
  restart: unless-stopped
  command: ["start-dev"]
  volumes:
    - ./auth/data:/opt/keycloak/data
```

## Access Information

### Admin Console
- **URL**: http://localhost:8082/admin
- **Username**: admin
- **Password**: admin

### Realm Management
- **Default Realm**: master
- **Custom Realm**: minicloud (recommended)

## Keycloak Setup

### 1. Initial Configuration
1. Access admin console tại http://localhost:8082/admin
2. Login với admin/admin
3. Tạo realm mới cho ứng dụng

### 2. Create Custom Realm
```bash
# Access Keycloak admin CLI
docker-compose exec auth /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

# Create realm
docker-compose exec auth /opt/keycloak/bin/kcadm.sh create realms -s realm=minicloud -s enabled=true
```

### 3. Client Configuration
- **Client ID**: minicloud-frontend
- **Client Protocol**: openid-connect
- **Access Type**: public
- **Valid Redirect URIs**: http://localhost:3000/*
- **Web Origins**: http://localhost:3000

## Authentication Flow

### 1. User Login
```
User → Frontend → Keycloak → User Authentication → JWT Token
```

### 2. API Access
```
Frontend → Backend API → JWT Validation → Keycloak → Response
```

### 3. Token Management
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (30 days)
- **ID Token**: User information

## Integration với Services

### Frontend Integration
```javascript
// Keycloak configuration
const keycloakConfig = {
  url: 'http://localhost:8082',
  realm: 'minicloud',
  clientId: 'minicloud-frontend'
};

// Initialize Keycloak
const keycloak = new Keycloak(keycloakConfig);
```

### Backend Integration
```javascript
// JWT validation middleware
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'http://auth:8080/realms/minicloud/protocol/openid-connect/certs'
});
```

## User Management

### Default Users
- **Admin**: admin/admin
- **Test User**: user/password (có thể tạo)

### User Roles
- **admin**: Full system access
- **user**: Basic user access
- **api**: API access only

### Custom Attributes
- **department**: User department
- **position**: User position
- **phone**: Phone number

## Security Configuration

### Password Policy
- Minimum length: 8 characters
- Require uppercase: Yes
- Require lowercase: Yes
- Require numbers: Yes
- Require special chars: Yes

### Session Management
- **Session Timeout**: 30 minutes
- **Remember Me**: 30 days
- **Concurrent Sessions**: 1 per user

### Multi-Factor Authentication
- **TOTP**: Time-based OTP
- **SMS**: SMS verification
- **Email**: Email verification

## Monitoring và Logs

### Health Check
```bash
# Check Keycloak status
curl http://localhost:8082/health/ready

# Check admin console
curl http://localhost:8082/admin
```

### Logs
```bash
# View Keycloak logs
docker-compose logs -f auth

# Access Keycloak logs inside container
docker-compose exec auth tail -f /opt/keycloak/data/log/keycloak.log
```

### Metrics
- **Active Sessions**: Real-time session count
- **Login Attempts**: Success/failure rates
- **Token Issuance**: Token generation metrics

## Backup và Restore

### Backup Keycloak Data
```bash
# Backup H2 database
docker-compose exec auth cp -r /opt/keycloak/data/h2 /backup/

# Backup configuration
docker-compose exec auth /opt/keycloak/bin/kcadm.sh get realms/minicloud > realm-backup.json
```

### Restore Process
```bash
# Restore H2 database
docker-compose exec auth cp -r /backup/h2 /opt/keycloak/data/

# Restore realm configuration
docker-compose exec auth /opt/keycloak/bin/kcadm.sh create realms -f realm-backup.json
```

## Troubleshooting

### Common Issues

1. **Admin console not accessible**: Check port mapping và firewall
2. **Login fails**: Verify admin credentials
3. **JWT validation fails**: Check realm và client configuration
4. **Database connection issues**: Check H2 database files

### Debug Commands

```bash
# Check container status
docker-compose ps auth

# Check container logs
docker-compose logs -f auth

# Access container shell
docker-compose exec auth bash

# Restart service
docker-compose restart auth

# Check database files
docker-compose exec auth ls -la /opt/keycloak/data/h2/
```

### Performance Issues

1. **Slow login**: Check database performance
2. **Memory usage**: Monitor JVM heap size
3. **Session timeout**: Adjust session settings

## Production Considerations

### Security Hardening
- Change default admin password
- Enable HTTPS
- Configure proper CORS
- Set up proper realm policies
- Enable audit logging

### High Availability
- Database clustering
- Load balancer configuration
- Session replication
- Backup automation

### Performance Optimization
- JVM tuning
- Database optimization
- Caching configuration
- Connection pooling
