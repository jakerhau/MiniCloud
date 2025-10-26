# Storage Server

Storage server sử dụng MinIO để cung cấp object storage tương thích với Amazon S3 cho hệ thống MiniCloud.

## Công nghệ sử dụng

- **Object Storage**: MinIO
- **Protocol**: S3-compatible API
- **Storage Engine**: Filesystem-based
- **Access**: Web UI và API

## MinIO Configuration

### Basic Settings
- **Port**: 9000 (API), 9001 (Console)
- **Root User**: admin123
- **Root Password**: strongpass123
- **Storage Path**: /data/storage
- **Mode**: Standalone

### Environment Variables
```bash
STORAGE_PATH=/data/storage
MINIO_ROOT_USER=admin123
MINIO_ROOT_PASSWORD=strongpass123
```

## Cấu trúc thư mục

```
storage-server/
├── data/                    # MinIO data storage
│   └── [user-data]/        # User uploaded files
│       └── [files]/        # Actual file storage
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## Docker Configuration

```yaml
storage-server:
  build:
    context: ./storage-server
    dockerfile: Dockerfile
  image: 52200292/storage-server:latest
  ports:
    - "9000:9000"    # MinIO API
    - "9001:9001"    # MinIO Console
  networks:
    - cloud-net
  restart: unless-stopped
  environment:
    - STORAGE_PATH=/data/storage
    - MINIO_ROOT_USER=admin123
    - MINIO_ROOT_PASSWORD=strongpass123
  volumes:
    - ./storage-server/data:/data
```

## Access Information

### MinIO Console (Web UI)
- **URL**: http://localhost:9001
- **Username**: admin123
- **Password**: strongpass123

### MinIO API
- **Endpoint**: http://localhost:9000
- **Access Key**: admin123
- **Secret Key**: strongpass123

## MinIO Setup

### 1. Initial Configuration
1. Access MinIO Console tại http://localhost:9001
2. Login với admin123/strongpass123
3. Tạo buckets cho ứng dụng

### 2. Create Buckets
```bash
# Using MinIO client (mc)
mc alias set local http://localhost:9000 admin123 strongpass123
mc mb local/user-uploads
mc mb local/documents
mc mb local/images
```

### 3. Bucket Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::user-uploads/*"
    }
  ]
}
```

## API Integration

### Frontend Integration
```javascript
// MinIO client configuration
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'admin123',
  secretKey: 'strongpass123'
});

// Upload file
const uploadFile = async (file, bucketName) => {
  const fileName = `${Date.now()}-${file.name}`;
  await minioClient.putObject(bucketName, fileName, file);
  return fileName;
};
```

### Backend Integration
```javascript
// File upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { bucket, fileName, fileData } = req.body;
    await minioClient.putObject(bucket, fileName, fileData);
    res.json({ success: true, fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## File Management

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Videos**: MP4, AVI, MOV
- **Archives**: ZIP, RAR, 7Z

### File Size Limits
- **Maximum file size**: 5GB per file
- **Maximum bucket size**: 100GB
- **Concurrent uploads**: 10 per user

### File Organization
```
/data/
├── user-uploads/           # User uploaded files
│   ├── images/            # Image files
│   ├── documents/         # Document files
│   └── videos/            # Video files
├── system/                # System files
└── temp/                  # Temporary files
```

## Security Configuration

### Access Control
- **Public buckets**: Read-only access
- **Private buckets**: Authenticated access only
- **Admin buckets**: Admin access only

### Authentication Methods
- **Access Key/Secret Key**: API access
- **IAM Policies**: Fine-grained permissions
- **Presigned URLs**: Temporary access

### Data Protection
- **Encryption at rest**: AES-256
- **Encryption in transit**: TLS 1.2+
- **Access logging**: All operations logged

## Monitoring và Logs

### Health Check
```bash
# Check MinIO status
curl http://localhost:9000/minio/health/live

# Check MinIO ready
curl http://localhost:9000/minio/health/ready
```

### Logs
```bash
# View MinIO logs
docker-compose logs -f storage-server

# Access MinIO logs inside container
docker-compose exec storage-server tail -f /data/.minio.log
```

### Metrics
- **Storage usage**: Total và per-bucket
- **Request count**: API calls per minute
- **Error rate**: Failed requests percentage
- **Response time**: Average response time

## Backup và Restore

### Backup Strategy
```bash
# Backup MinIO data
docker-compose exec storage-server tar -czf /backup/minio-data.tar.gz /data

# Backup bucket policies
mc admin policy list local > policies-backup.json
```

### Restore Process
```bash
# Restore MinIO data
docker-compose exec storage-server tar -xzf /backup/minio-data.tar.gz -C /

# Restore bucket policies
mc admin policy add local policy-name policies-backup.json
```

## Performance Optimization

### Storage Optimization
- **SSD storage**: For better I/O performance
- **RAID configuration**: For redundancy
- **Compression**: Enable file compression
- **Deduplication**: Remove duplicate files

### Network Optimization
- **CDN integration**: For global access
- **Load balancing**: Multiple MinIO instances
- **Caching**: Frequently accessed files

## Troubleshooting

### Common Issues

1. **Console not accessible**: Check port 9001 mapping
2. **API connection fails**: Verify credentials và endpoint
3. **Upload fails**: Check file size limits
4. **Permission denied**: Verify bucket policies

### Debug Commands

```bash
# Check container status
docker-compose ps storage-server

# Check container logs
docker-compose logs -f storage-server

# Access container shell
docker-compose exec storage-server sh

# Check storage usage
docker-compose exec storage-server du -sh /data

# Restart service
docker-compose restart storage-server
```

### Performance Issues

1. **Slow uploads**: Check disk I/O
2. **High memory usage**: Monitor MinIO memory
3. **Network timeouts**: Check network configuration

## Production Considerations

### High Availability
- **Distributed mode**: Multiple MinIO instances
- **Load balancer**: Distribute requests
- **Data replication**: Cross-region replication
- **Backup automation**: Regular backups

### Security Hardening
- **HTTPS only**: Enable SSL/TLS
- **Strong passwords**: Complex access keys
- **Network security**: Firewall rules
- **Audit logging**: Comprehensive logging

### Scaling
- **Horizontal scaling**: Add more nodes
- **Vertical scaling**: Increase resources
- **Storage expansion**: Add more storage
- **Performance tuning**: Optimize configuration
