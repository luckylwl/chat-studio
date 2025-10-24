# 🚀 AI Chat Studio Backend - Deployment Checklist

## 📋 部署前检查清单

### ✅ 开发环境准备

- [ ] Python 3.9+ 已安装
- [ ] 所有依赖已安装 (`pip install -r requirements.txt`)
- [ ] 本地测试通过 (`python test_api.py`)
- [ ] 所有端点正常工作
- [ ] WebSocket连接正常
- [ ] 前后端集成测试通过

### 🔐 安全配置

- [ ] 修改默认SECRET_KEY
- [ ] 配置强密码策略
- [ ] 启用HTTPS/WSS
- [ ] 配置CORS白名单
- [ ] 实现请求限流
- [ ] 添加SQL注入防护
- [ ] 实现XSS防护
- [ ] 配置CSP头
- [ ] 敏感信息使用环境变量
- [ ] 启用日志审计

### 🗄️ 数据库

- [ ] 选择生产数据库 (PostgreSQL/MySQL)
- [ ] 配置数据库连接池
- [ ] 实现数据备份策略
- [ ] 创建数据迁移脚本
- [ ] 配置数据库索引
- [ ] 测试数据恢复流程

### ⚡ 性能优化

- [ ] 启用Gzip压缩
- [ ] 配置缓存策略 (Redis)
- [ ] 实现API响应缓存
- [ ] 优化数据库查询
- [ ] 配置CDN (如需要)
- [ ] 启用HTTP/2
- [ ] 实现连接池
- [ ] 配置Worker数量

### 📊 监控和日志

- [ ] 配置日志系统
- [ ] 实现错误追踪 (Sentry)
- [ ] 配置性能监控 (Prometheus)
- [ ] 设置告警规则
- [ ] 配置日志轮转
- [ ] 实现健康检查端点
- [ ] 配置访问日志
- [ ] 监控系统资源使用

### 🔄 CI/CD

- [ ] 配置自动化测试
- [ ] 设置持续集成管道
- [ ] 配置自动部署
- [ ] 实现回滚机制
- [ ] 配置环境变量管理
- [ ] 设置版本标签

### 🌐 基础设施

- [ ] 配置反向代理 (Nginx)
- [ ] 设置负载均衡
- [ ] 配置防火墙规则
- [ ] 启用自动重启
- [ ] 配置域名和SSL证书
- [ ] 设置备份服务器
- [ ] 配置容器化 (Docker)

---

## 🔧 环境配置模板

### .env.production

```bash
# ==================== 服务器配置 ====================
HOST=0.0.0.0
PORT=8000
WORKERS=4
RELOAD=false
LOG_LEVEL=info

# ==================== 安全配置 ====================
# 重要: 使用强随机密钥!
# 生成命令: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-very-secure-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ==================== CORS配置 ====================
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# ==================== 数据库配置 ====================
# PostgreSQL (推荐)
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/chatdb
# 或 MySQL
# DATABASE_URL=mysql+aiomysql://username:password@localhost:3306/chatdb

# 数据库连接池
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_TIMEOUT=30

# ==================== Redis配置 ====================
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your-redis-password
REDIS_MAX_CONNECTIONS=50

# ==================== AI API配置 ====================
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORG_ID=org-your-org-id
OPENAI_DEFAULT_MODEL=gpt-4

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# 其他AI服务
COHERE_API_KEY=your-cohere-key
HUGGINGFACE_API_KEY=your-hf-key

# ==================== 限流配置 ====================
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# ==================== 文件上传 ====================
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=txt,pdf,doc,docx,png,jpg

# ==================== 监控配置 ====================
# Sentry
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Prometheus
PROMETHEUS_PORT=9090

# ==================== 邮件配置 (可选) ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# ==================== 其他配置 ====================
# 时区
TIMEZONE=Asia/Shanghai

# 调试模式 (生产环境设为false)
DEBUG=false

# 启用API文档 (生产环境可关闭)
ENABLE_DOCS=false
```

---

## 🐳 Docker部署配置

### 优化的Dockerfile

```dockerfile
# 多阶段构建
FROM python:3.11-slim as builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir --user -r requirements.txt

# ==================== 最终镜像 ====================
FROM python:3.11-slim

WORKDIR /app

# 复制已安装的依赖
COPY --from=builder /root/.local /root/.local

# 确保脚本在PATH中
ENV PATH=/root/.local/bin:$PATH

# 创建非root用户
RUN useradd -m -u 1000 chatuser && chown -R chatuser:chatuser /app
USER chatuser

# 复制应用代码
COPY --chown=chatuser:chatuser . .

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 生产级docker-compose.yml

```yaml
version: '3.8'

services:
  # ==================== 后端服务 ====================
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: chat-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env.production
    environment:
      - DATABASE_URL=postgresql+asyncpg://chatuser:${DB_PASSWORD}@postgres:5432/chatdb
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - chat-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ==================== PostgreSQL数据库 ====================
  postgres:
    image: postgres:15-alpine
    container_name: chat-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=chatdb
      - POSTGRES_USER=chatuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - PGDATA=/var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - chat-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chatuser -d chatdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ==================== Redis缓存 ====================
  redis:
    image: redis:7-alpine
    container_name: chat-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - chat-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # ==================== Nginx反向代理 ====================
  nginx:
    image: nginx:alpine
    container_name: chat-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
    networks:
      - chat-network

  # ==================== Prometheus监控 ====================
  prometheus:
    image: prom/prometheus:latest
    container_name: chat-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - chat-network

  # ==================== Grafana可视化 ====================
  grafana:
    image: grafana/grafana:latest
    container_name: chat-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    networks:
      - chat-network

networks:
  chat-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
```

---

## 🌐 Nginx配置

### nginx.conf (生产级)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # 上游服务器
    upstream backend {
        least_conn;
        server backend:8000 max_fails=3 fail_timeout=30s;
        # 如果有多个实例
        # server backend2:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL证书
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # 健康检查
        location /health {
            access_log off;
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        # API端点
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn addr 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_cache_bypass $http_upgrade;

            # 超时配置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket端点
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket超时
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
            proxy_connect_timeout 60s;
        }

        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 根路径
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 🔒 安全加固脚本

### security_hardening.py

```python
"""
安全加固工具
运行此脚本来检查和加固安全配置
"""

import os
import secrets
import sys
from pathlib import Path

def generate_secret_key():
    """生成安全的SECRET_KEY"""
    return secrets.token_urlsafe(32)

def check_environment():
    """检查环境配置"""
    issues = []

    # 检查SECRET_KEY
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key or secret_key == "your-secret-key-change-in-production":
        issues.append("⚠️  SECRET_KEY使用默认值，必须更改!")
        print(f"建议的SECRET_KEY: {generate_secret_key()}")

    # 检查调试模式
    if os.getenv("DEBUG", "false").lower() == "true":
        issues.append("⚠️  DEBUG模式在生产环境应该关闭")

    # 检查ALLOWED_ORIGINS
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
    if "*" in allowed_origins:
        issues.append("⚠️  CORS配置允许所有来源，存在安全风险")

    # 检查数据库URL
    db_url = os.getenv("DATABASE_URL", "")
    if "localhost" in db_url or "127.0.0.1" in db_url:
        issues.append("⚠️  数据库URL包含localhost，可能不适合生产环境")

    return issues

def check_file_permissions():
    """检查文件权限"""
    sensitive_files = [".env", ".env.production", "main.py"]
    issues = []

    for filename in sensitive_files:
        if Path(filename).exists():
            stat = os.stat(filename)
            mode = oct(stat.st_mode)[-3:]
            if mode != "600" and mode != "400":
                issues.append(f"⚠️  {filename} 文件权限过于宽松: {mode}")

    return issues

def main():
    print("🔒 AI Chat Studio - 安全检查")
    print("=" * 60)

    env_issues = check_environment()
    perm_issues = check_file_permissions()

    all_issues = env_issues + perm_issues

    if all_issues:
        print("\n发现以下安全问题:\n")
        for issue in all_issues:
            print(issue)
        print("\n请修复这些问题后再部署到生产环境!")
        sys.exit(1)
    else:
        print("✅ 所有安全检查通过!")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

---

## 📊 监控配置

### prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'chat-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

---

## 🚀 部署脚本

### deploy.sh

```bash
#!/bin/bash

set -e

echo "🚀 开始部署 AI Chat Studio Backend..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查环境变量
if [ ! -f .env.production ]; then
    echo -e "${RED}错误: .env.production 文件不存在${NC}"
    exit 1
fi

# 加载环境变量
export $(cat .env.production | grep -v '^#' | xargs)

# 运行安全检查
echo -e "${YELLOW}运行安全检查...${NC}"
python security_hardening.py
if [ $? -ne 0 ]; then
    echo -e "${RED}安全检查失败，部署终止${NC}"
    exit 1
fi

# 备份数据库
echo -e "${YELLOW}备份数据库...${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U chatuser chatdb > backup_${timestamp}.sql
echo -e "${GREEN}✓ 数据库备份完成: backup_${timestamp}.sql${NC}"

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull origin main

# 构建Docker镜像
echo -e "${YELLOW}构建Docker镜像...${NC}"
docker-compose build --no-cache

# 停止旧容器
echo -e "${YELLOW}停止旧容器...${NC}"
docker-compose down

# 启动新容器
echo -e "${YELLOW}启动新容器...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 健康检查
echo -e "${YELLOW}执行健康检查...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务健康检查通过${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "等待服务启动... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ 健康检查失败，部署可能有问题${NC}"
    echo -e "${YELLOW}查看日志: docker-compose logs backend${NC}"
    exit 1
fi

# 清理旧镜像
echo -e "${YELLOW}清理旧镜像...${NC}"
docker image prune -f

echo -e "${GREEN}🎉 部署完成!${NC}"
echo "API地址: https://yourdomain.com"
echo "监控面板: http://localhost:3001"
echo "查看日志: docker-compose logs -f backend"
```

### 使用部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📝 部署后验证

### 自动化验证脚本

```bash
#!/bin/bash

echo "🧪 执行部署后验证..."

# 测试API端点
endpoints=(
    "GET /health"
    "GET /"
)

for endpoint in "${endpoints[@]}"; do
    method=$(echo $endpoint | cut -d' ' -f1)
    path=$(echo $endpoint | cut -d' ' -f2)

    if curl -X $method -f https://yourdomain.com$path > /dev/null 2>&1; then
        echo "✓ $endpoint - 通过"
    else
        echo "✗ $endpoint - 失败"
    fi
done

echo "验证完成!"
```

---

## 🆘 回滚流程

如果部署出现问题，执行以下步骤:

```bash
# 1. 停止当前容器
docker-compose down

# 2. 恢复到之前的版本
git checkout <previous-commit-hash>

# 3. 恢复数据库备份
docker-compose up -d postgres
docker-compose exec -T postgres psql -U chatuser -d chatdb < backup_<timestamp>.sql

# 4. 重新启动服务
docker-compose up -d

# 5. 验证服务
curl http://localhost:8000/health
```

---

## 📞 支持和联系

部署过程中遇到问题?

1. 查看日志: `docker-compose logs -f backend`
2. 检查配置: 参考本文档的故障排查部分
3. 查阅API文档: https://yourdomain.com/docs

祝部署顺利! 🚀
