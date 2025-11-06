# proxy/Dockerfile
FROM nginx:stable

# Cài ping + vài tool debug mạng
RUN apt-get update && \
    apt-get install -y iputils-ping dnsutils curl && \
    rm -rf /var/lib/apt/lists/*

# bake sẵn conf vào image thì dùng:
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
