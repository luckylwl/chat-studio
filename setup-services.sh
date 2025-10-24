#!/bin/bash

##############################################################################
# AI Chat Studio - 服务部署脚本
#
# 此脚本自动设置和启动所需的后端服务:
#   - PostgreSQL (数据库)
#   - Redis (缓存)
#   - ChromaDB (向量数据库)
#
# 使用方法:
#   chmod +x setup-services.sh
#   ./setup-services.sh
#
# 选项:
#   --skip-postgres   跳过 PostgreSQL 设置
#   --skip-redis      跳过 Redis 设置
#   --skip-chroma     跳过 ChromaDB 设置
#   --clean           清除现有容器和数据
##############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo ""
    echo "======================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "======================================================================"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 解析命令行参数
SKIP_POSTGRES=false
SKIP_REDIS=false
SKIP_CHROMA=false
CLEAN_MODE=false

for arg in "$@"; do
    case $arg in
        --skip-postgres)
            SKIP_POSTGRES=true
            shift
            ;;
        --skip-redis)
            SKIP_REDIS=true
            shift
            ;;
        --skip-chroma)
            SKIP_CHROMA=true
            shift
            ;;
        --clean)
            CLEAN_MODE=true
            shift
            ;;
    esac
done

# 检查 Docker 是否已安装
check_docker() {
    print_header "检查 Docker"

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装！"
        print_info "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
        exit 1
    fi

    print_success "Docker 已安装: $(docker --version)"

    if ! docker info &> /dev/null; then
        print_error "Docker 未运行！"
        print_info "请启动 Docker Desktop 或 Docker 守护进程"
        exit 1
    fi

    print_success "Docker 正在运行"
}

# 清理现有容器
clean_containers() {
    print_header "清理现有容器"

    containers=("chat-studio-postgres" "chat-studio-redis" "chat-studio-chroma")

    for container in "${containers[@]}"; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            print_info "停止并删除容器: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
            print_success "已删除: $container"
        fi
    done

    # 清理卷（可选）
    read -p "是否删除所有数据卷? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume rm chat-studio-postgres-data 2>/dev/null || true
        docker volume rm chat-studio-redis-data 2>/dev/null || true
        docker volume rm chat-studio-chroma-data 2>/dev/null || true
        print_success "已清理数据卷"
    fi
}

# 生成随机密码
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# 设置 PostgreSQL
setup_postgresql() {
    if [ "$SKIP_POSTGRES" = true ]; then
        print_warning "跳过 PostgreSQL 设置"
        return
    fi

    print_header "设置 PostgreSQL"

    # 检查是否已存在
    if docker ps --format '{{.Names}}' | grep -q "^chat-studio-postgres$"; then
        print_warning "PostgreSQL 容器已在运行"
        return
    fi

    # 生成密码
    DB_PASSWORD=$(generate_password)
    echo "$DB_PASSWORD" > .postgres-password
    print_info "数据库密码已保存到 .postgres-password"

    # 启动容器
    print_info "启动 PostgreSQL 容器..."

    docker run -d \
        --name chat-studio-postgres \
        --restart unless-stopped \
        -e POSTGRES_DB=chat_studio \
        -e POSTGRES_USER=chatuser \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -p 5432:5432 \
        -v chat-studio-postgres-data:/var/lib/postgresql/data \
        postgres:15-alpine

    # 等待数据库启动
    print_info "等待数据库就绪..."
    sleep 5

    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec chat-studio-postgres pg_isready -U chatuser -d chat_studio &> /dev/null; then
            print_success "PostgreSQL 已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL 启动超时"
        exit 1
    fi

    # 创建初始表结构（如果后端有 init.sql）
    if [ -f "backend/init.sql" ]; then
        print_info "初始化数据库表..."
        docker exec -i chat-studio-postgres psql -U chatuser -d chat_studio < backend/init.sql
        print_success "数据库初始化完成"
    fi

    print_success "PostgreSQL 设置完成"
    print_info "连接字符串: postgresql://chatuser:$DB_PASSWORD@localhost:5432/chat_studio"
}

# 设置 Redis
setup_redis() {
    if [ "$SKIP_REDIS" = true ]; then
        print_warning "跳过 Redis 设置"
        return
    fi

    print_header "设置 Redis"

    # 检查是否已存在
    if docker ps --format '{{.Names}}' | grep -q "^chat-studio-redis$"; then
        print_warning "Redis 容器已在运行"
        return
    fi

    # 生成密码
    REDIS_PASSWORD=$(generate_password)
    echo "$REDIS_PASSWORD" > .redis-password
    print_info "Redis 密码已保存到 .redis-password"

    # 启动容器
    print_info "启动 Redis 容器..."

    docker run -d \
        --name chat-studio-redis \
        --restart unless-stopped \
        -p 6379:6379 \
        -v chat-studio-redis-data:/data \
        redis:7-alpine \
        redis-server --requirepass "$REDIS_PASSWORD" --appendonly yes

    # 等待 Redis 启动
    print_info "等待 Redis 就绪..."
    sleep 3

    max_attempts=15
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec chat-studio-redis redis-cli -a "$REDIS_PASSWORD" ping &> /dev/null; then
            print_success "Redis 已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        print_error "Redis 启动超时"
        exit 1
    fi

    print_success "Redis 设置完成"
    print_info "连接字符串: redis://:$REDIS_PASSWORD@localhost:6379"
}

# 设置 ChromaDB
setup_chromadb() {
    if [ "$SKIP_CHROMA" = true ]; then
        print_warning "跳过 ChromaDB 设置"
        return
    fi

    print_header "设置 ChromaDB"

    # 检查是否已存在
    if docker ps --format '{{.Names}}' | grep -q "^chat-studio-chroma$"; then
        print_warning "ChromaDB 容器已在运行"
        return
    fi

    # 创建数据目录
    mkdir -p ./data/chroma

    # 启动容器
    print_info "启动 ChromaDB 容器..."

    docker run -d \
        --name chat-studio-chroma \
        --restart unless-stopped \
        -p 8000:8000 \
        -v chat-studio-chroma-data:/chroma/chroma \
        -e IS_PERSISTENT=TRUE \
        -e ANONYMIZED_TELEMETRY=FALSE \
        chromadb/chroma:latest

    # 等待 ChromaDB 启动
    print_info "等待 ChromaDB 就绪..."
    sleep 5

    max_attempts=20
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8000/api/v1/heartbeat &> /dev/null; then
            print_success "ChromaDB 已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        print_error "ChromaDB 启动超时"
        exit 1
    fi

    print_success "ChromaDB 设置完成"
    print_info "API 地址: http://localhost:8000"
}

# 创建 .env 文件
create_env_file() {
    print_header "创建环境配置文件"

    if [ -f ".env.local" ]; then
        print_warning ".env.local 已存在，跳过创建"
        return
    fi

    DB_PASSWORD=$(cat .postgres-password 2>/dev/null || echo "")
    REDIS_PASSWORD=$(cat .redis-password 2>/dev/null || echo "")

    cat > .env.local << EOF
# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://chatuser:${DB_PASSWORD}@localhost:5432/chat_studio

# ==================== Redis 配置 ====================
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_MAX_CONNECTIONS=50

# ==================== ChromaDB 配置 ====================
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_PERSIST_DIR=./data/chroma
USE_REMOTE_CHROMA=true
CHROMA_HTTP_HOST=http://localhost:8000

# ==================== 应用配置 ====================
NODE_ENV=development
LOG_LEVEL=debug
EOF

    print_success "已创建 .env.local"
    print_info "请根据需要修改配置"
}

# 显示服务状态
show_status() {
    print_header "服务状态"

    services=(
        "chat-studio-postgres:5432:PostgreSQL"
        "chat-studio-redis:6379:Redis"
        "chat-studio-chroma:8000:ChromaDB"
    )

    for service in "${services[@]}"; do
        IFS=':' read -r name port display <<< "$service"

        if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
            status="running"
            status_color="${GREEN}"
            status_symbol="✓"
        else
            status="stopped"
            status_color="${RED}"
            status_symbol="✗"
        fi

        echo -e "${status_color}${status_symbol} ${display}${NC} (${name}) - Port ${port}"
    done
}

# 显示连接信息
show_connection_info() {
    print_header "连接信息"

    if [ -f ".postgres-password" ]; then
        DB_PASSWORD=$(cat .postgres-password)
        echo -e "${BLUE}PostgreSQL:${NC}"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: chat_studio"
        echo "  User: chatuser"
        echo "  Password: $DB_PASSWORD"
        echo "  Connection String: postgresql://chatuser:$DB_PASSWORD@localhost:5432/chat_studio"
        echo ""
    fi

    if [ -f ".redis-password" ]; then
        REDIS_PASSWORD=$(cat .redis-password)
        echo -e "${BLUE}Redis:${NC}"
        echo "  Host: localhost"
        echo "  Port: 6379"
        echo "  Password: $REDIS_PASSWORD"
        echo "  Connection String: redis://:$REDIS_PASSWORD@localhost:6379"
        echo ""
    fi

    echo -e "${BLUE}ChromaDB:${NC}"
    echo "  Host: localhost"
    echo "  Port: 8000"
    echo "  API: http://localhost:8000"
    echo ""
}

# 显示下一步操作
show_next_steps() {
    print_header "下一步操作"

    echo "1. 复制 .env.local 到后端目录:"
    echo "   cp .env.local backend/.env"
    echo ""
    echo "2. 安装 Python 依赖:"
    echo "   cd backend && pip install -r requirements.txt"
    echo ""
    echo "3. 启动后端服务:"
    echo "   cd backend && python main.py"
    echo ""
    echo "4. 启动前端开发服务器:"
    echo "   npm run dev"
    echo ""
    echo "管理命令:"
    echo "  查看日志:  docker logs -f <container-name>"
    echo "  停止服务:  docker stop <container-name>"
    echo "  启动服务:  docker start <container-name>"
    echo "  重启服务:  docker restart <container-name>"
    echo ""
    print_info "所有服务密码保存在 .postgres-password 和 .redis-password 文件中"
    print_warning "请妥善保管密码文件，不要提交到版本控制系统！"
}

# 主函数
main() {
    print_header "AI Chat Studio - 服务部署"

    # 清理模式
    if [ "$CLEAN_MODE" = true ]; then
        clean_containers
    fi

    # 检查环境
    check_docker

    # 设置服务
    setup_postgresql
    setup_redis
    setup_chromadb

    # 创建配置文件
    create_env_file

    # 显示状态
    show_status
    show_connection_info
    show_next_steps

    print_success "所有服务设置完成！"
}

# 错误处理
trap 'print_error "脚本执行失败！"; exit 1' ERR

# 运行主函数
main
