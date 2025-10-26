FROM alpine:latest
RUN apk add --no-cache curl

# Tạo user/password mặc định 
ENV MINIO_ROOT_USER="admin123"
ENV MINIO_ROOT_PASSWORD="strongpass123"

RUN curl -LO https://dl.min.io/server/minio/release/linux-amd64/minio \
    && chmod +x minio \
    && mv minio /usr/local/bin/minio

EXPOSE 9000 9001
ENTRYPOINT ["minio", "server", "/data", "--console-address", ":9001"]
