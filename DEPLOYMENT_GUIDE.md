# Deployment Guide - AI Chat Studio

This guide covers deploying AI Chat Studio to production using Docker, Docker Compose, and various cloud platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Docker Deployment](#local-docker-deployment)
- [Production Deployment](#production-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Docker 20.10+
- Docker Compose 2.0+
- Git
- (Production) Domain name with DNS configured
- (Production) SSL certificate (Let's Encrypt recommended)

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD

## Local Docker Deployment

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/chat-studio.git
cd chat-studio
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- Redis password
- Secret key (generate with `openssl rand -hex 32`)
- AI API keys (optional)

### 3. Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test frontend
curl http://localhost:8080

# Test backend
curl http://localhost:8000/health

# Test database
docker-compose exec postgres psql -U postgres -d chat_studio -c "SELECT 1;"
```

### 5. Access Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Deployment

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Enable Docker on startup
sudo systemctl enable docker
```

### 2. Configure Firewall

```bash
# Allow HTTP, HTTPS, SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. Set Up SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d chat-studio.example.com

# Copy certificates to project
sudo mkdir -p /path/to/chat-studio/ssl
sudo cp /etc/letsencrypt/live/chat-studio.example.com/fullchain.pem /path/to/chat-studio/ssl/
sudo cp /etc/letsencrypt/live/chat-studio.example.com/privkey.pem /path/to/chat-studio/ssl/
```

### 4. Configure Production Environment

Edit `.env` for production:

```env
APP_ENV=production
VITE_APP_ENV=production

# Update URLs to production domain
VITE_BACKEND_API_URL=https://chat-studio.example.com/api
VITE_BACKEND_WS_URL=wss://chat-studio.example.com/ws

# Security - generate strong secrets
SECRET_KEY=<generated-secret-key>
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>

# Enable security features
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=https://chat-studio.example.com

# Configure monitoring
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_GA_TRACKING_ID=<your-ga-id>
```

### 5. Update Nginx Configuration

Edit `nginx.conf` and uncomment the production server block. Update:
- `server_name` to your domain
- SSL certificate paths
- Backend/frontend upstream servers

### 6. Deploy

```bash
# Pull latest code
git pull origin main

# Build production images
docker-compose -f docker-compose.yml build --no-cache

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec backend python -m alembic upgrade head

# Verify deployment
docker-compose ps
docker-compose logs -f
```

### 7. Set Up Auto-Renewal for SSL

```bash
# Create renewal script
sudo crontab -e

# Add line (runs twice daily):
0 0,12 * * * certbot renew --quiet --post-hook "docker-compose -f /path/to/chat-studio/docker-compose.yml restart nginx"
```

## Cloud Platform Deployment

### AWS Deployment

#### Option 1: AWS ECS (Elastic Container Service)

```bash
# Install AWS CLI
aws configure

# Create ECR repository
aws ecr create-repository --repository-name chat-studio-frontend
aws ecr create-repository --repository-name chat-studio-backend

# Build and push images
$(aws ecr get-login --no-include-email)
docker tag chat-studio-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/chat-studio-frontend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/chat-studio-frontend:latest

# Create ECS cluster, task definitions, and services using AWS Console or CLI
```

#### Option 2: AWS EC2

```bash
# Launch EC2 instance (t3.medium or larger)
# SSH into instance
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Follow "Production Deployment" steps above
```

### Google Cloud Platform (GCP)

#### Using Google Cloud Run

```bash
# Install gcloud CLI
gcloud auth login
gcloud config set project <project-id>

# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/chat-studio-frontend
gcloud builds submit --tag gcr.io/<project-id>/chat-studio-backend

# Deploy to Cloud Run
gcloud run deploy chat-studio-frontend \
  --image gcr.io/<project-id>/chat-studio-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy chat-studio-backend \
  --image gcr.io/<project-id>/chat-studio-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean

#### Using App Platform

1. Connect GitHub repository
2. Configure build settings:
   - Frontend: `npm run build`
   - Backend: `pip install -r requirements.txt`
3. Set environment variables
4. Deploy

#### Using Droplet

```bash
# Create droplet (4GB RAM minimum)
# SSH into droplet
ssh root@<droplet-ip>

# Follow "Production Deployment" steps above
```

### Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Configure environment variables in Vercel dashboard
```

## Environment Configuration

### Frontend Variables (`.env`)

```env
# Required
VITE_BACKEND_API_URL=<backend-url>
VITE_APP_ENV=production

# Optional
VITE_OPENAI_API_KEY=<key>
VITE_ANTHROPIC_API_KEY=<key>
VITE_SENTRY_DSN=<dsn>
VITE_ENABLE_CSP=true
```

### Backend Variables

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=<secret>

# Optional
REDIS_URL=redis://:password@host:6379/0
OPENAI_API_KEY=<key>
CORS_ORIGINS=https://yourdomain.com
```

## Database Migration

### Initial Setup

```bash
# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Verify
docker-compose exec postgres psql -U postgres -d chat_studio -c "\dt"
```

### Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres chat_studio > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres chat_studio < backup_20231201.sql
```

### Migration in Production

```bash
# 1. Backup database
./scripts/backup-db.sh

# 2. Run migration
docker-compose exec backend alembic upgrade head

# 3. Verify
docker-compose exec backend alembic current

# 4. Rollback if needed
docker-compose exec backend alembic downgrade -1
```

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

### Custom Certificate

1. Obtain certificate from provider
2. Copy `fullchain.pem` and `privkey.pem` to `./ssl/`
3. Update `nginx.conf` paths
4. Restart nginx: `docker-compose restart nginx`

## Monitoring and Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Log Rotation

Create `/etc/logrotate.d/docker-compose`:

```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
```

### Monitoring with Prometheus + Grafana

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -m

# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend python -c "from database.connection import test_connection; test_connection()"
```

### Frontend Can't Connect to Backend

1. Check CORS settings in backend `.env`
2. Verify `VITE_BACKEND_API_URL` in frontend `.env`
3. Check nginx proxy configuration
4. Verify firewall rules

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Limit container memory in docker-compose.yml:
services:
  backend:
    mem_limit: 2g
    mem_reservation: 1g
```

### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in ssl/fullchain.pem -noout -dates

# Renew Let's Encrypt
sudo certbot renew

# Test SSL configuration
curl -vI https://yourdomain.com
```

## Performance Optimization

### Enable HTTP/2

Already enabled in production nginx config.

### Enable Caching

```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
}
```

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Analyze tables
ANALYZE conversations;
ANALYZE messages;
```

### Redis Caching

Backend already implements Redis caching for frequently accessed data.

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SECRET_KEY (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Enable CSP headers
- [ ] Set up regular database backups
- [ ] Configure rate limiting
- [ ] Enable security monitoring (Sentry)
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Disable debug mode in production

## Maintenance

### Regular Updates

```bash
# Update code
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Clean up old images
docker image prune -a
```

### Database Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres chat_studio | gzip > backups/backup_$DATE.sql.gz

# Schedule with cron (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/chat-studio/issues
- Documentation: https://docs.chat-studio.example.com
- Email: support@chat-studio.example.com
