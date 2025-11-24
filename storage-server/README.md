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
- **Storage Path thực tế**: `/data` (ENTRYPOINT chỉ rõ) – biến `STORAGE_PATH=/data/storage` trong compose HIỆN KHÔNG được Dockerfile sử dụng.
- **Mode**: Standalone

### Environment Variables (đang khai báo)
```bash
MINIO_ROOT_USER=admin123
MINIO_ROOT_PASSWORD=strongpass123
# STORAGE_PATH (không được dùng bởi ENTRYPOINT hiện tại)
```
Khuyến nghị: Xoá biến `STORAGE_PATH` khỏi compose hoặc sửa Dockerfile thành:
```dockerfile
ENTRYPOINT ["minio", "server", "$STORAGE_PATH", "--console-address", ":9001"]
```


## Cấu trúc thư mục

```
storage-server/
├── data/            # Thư mục trống ban đầu – MinIO tự tạo cấu trúc nội bộ
├── Dockerfile        # Build Alpine + binary minio
└── README.md
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
    - MINIO_ROOT_USER=admin123
    - MINIO_ROOT_PASSWORD=strongpass123
    # STORAGE_PATH bỏ qua (không tác động đến ENTRYPOINT hiện tại)
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

## API Integration (Ví dụ tham khảo – KHÔNG nằm trong repo)

### Frontend Integration (Example)
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

### Backend Integration (Example)
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

## File Management (Khuyến nghị – CHƯA cấu hình tự động)

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Videos**: MP4, AVI, MOV
- **Archives**: ZIP, RAR, 7Z

### File Size Limits (Ví dụ)
- Maximum file size: 5GB per file (giới hạn phụ thuộc cấu hình/tài nguyên, không enforced trong repo)
- Maximum bucket size: 100GB (giới hạn logic – cần script giám sát để thực thi)
- Concurrent uploads: 10 per user (cần lớp ứng dụng bên ngoài kiểm soát)

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

## Security Configuration (Khuyến nghị – CHƯA triển khai)

### Access Control
- **Public buckets**: Read-only access
- **Private buckets**: Authenticated access only
- **Admin buckets**: Admin access only

### Authentication Methods
- **Access Key/Secret Key**: API access
- **IAM Policies**: Fine-grained permissions
- **Presigned URLs**: Temporary access

### Data Protection
- Encryption at rest: CẦN bật KMS / SSE cấu hình thêm (chưa có)
- Encryption in transit: Hiện dùng HTTP (muốn TLS cần reverse proxy hoặc cài cert)
- Access logging: Chưa lưu vào file – chỉ stdout container

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
# Xem log realtime (stdout)
docker compose logs -f storage-server

# Không có file /data/.minio.log mặc định trong setup này
```

### Metrics
- **Storage usage**: Total và per-bucket
- **Request count**: API calls per minute
- **Error rate**: Failed requests percentage
- **Response time**: Average response time

## Backup và Restore (Tuỳ chọn – yêu cầu mount /backup hoặc chạy trên host)

Nếu muốn backup nội bộ container cần mount thêm volume `/backup`. Hiện compose KHÔNG khai báo.
```bash
# Backup dữ liệu (chạy trên host, tránh thiếu /backup)
tar -czf minio-data-$(date +%F).tar.gz -C storage-server/data .

# Backup policies (cần cài mc trên host)
mc alias set local http://localhost:9000 admin123 strongpass123
mc admin policy list local > policies-backup.json
```
Restore:
```bash
tar -xzf minio-data-YYYY-MM-DD.tar.gz -C storage-server/data
# Re-import policy nếu đã dùng custom
mc admin policy add local policy-name policies-backup.json
```

## Performance Optimization

### Storage Optimization (Ý tưởng, chưa áp dụng)
- SSD storage để cải thiện I/O
- RAID / distributed MinIO cho redundancy
- Compression / deduplication yêu cầu lớp ứng dụng hoặc middleware

### Network Optimization (Ý tưởng)
- CDN integration (qua reverse proxy ngoài)
- Load balancing: nhiều instance MinIO ở chế độ distributed
- Caching: sử dụng layer proxy hoặc edge cache

## Troubleshooting

### Common Issues

1. Console not accessible: Port 9001 chưa publish hoặc container chưa chạy.
2. API connection fails: Sai accessKey/secret hoặc dùng HTTPS khi service chỉ hỗ trợ HTTP.
3. Upload fails: Bucket chưa tạo hoặc vượt giới hạn tài nguyên host (không phải giới hạn logic trong README).
4. Permission denied: Chưa thiết lập bucket policy tương ứng (mặc định private).

### Debug Commands

```bash
# Check container status
docker compose ps storage-server

# Check container logs
docker compose logs -f storage-server

# Access container shell
docker compose exec storage-server sh

# Check storage usage
docker compose exec storage-server du -sh /data

# Restart service
docker compose restart storage-server
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
