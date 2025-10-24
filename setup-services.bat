@echo off
REM ##############################################################################
REM AI Chat Studio - Windows 服务部署脚本
REM
REM 此脚本自动设置和启动所需的后端服务:
REM   - PostgreSQL (数据库)
REM   - Redis (缓存)
REM   - ChromaDB (向量数据库)
REM
REM 使用方法: 双击运行或在命令行中执行 setup-services.bat
REM ##############################################################################

setlocal enabledelayedexpansion

REM 设置控制台编码为 UTF-8
chcp 65001 >nul

echo.
echo ======================================================================
echo AI Chat Studio - 服务部署 (Windows)
echo ======================================================================
echo.

REM 检查 Docker 是否已安装
echo 检查 Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装!
    echo 请访问 https://docs.docker.com/desktop/install/windows-install/ 安装 Docker Desktop
    pause
    exit /b 1
)
echo [成功] Docker 已安装

REM 检查 Docker 是否在运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行!
    echo 请启动 Docker Desktop
    pause
    exit /b 1
)
echo [成功] Docker 正在运行
echo.

REM ==================== PostgreSQL ====================
echo ======================================================================
echo 设置 PostgreSQL
echo ======================================================================

REM 检查容器是否已存在
docker ps -a --format "{{.Names}}" | findstr /x "chat-studio-postgres" >nul
if not errorlevel 1 (
    echo [警告] PostgreSQL 容器已存在
    choice /C YN /M "是否删除并重新创建"
    if errorlevel 2 goto skip_postgres
    docker stop chat-studio-postgres >nul 2>&1
    docker rm chat-studio-postgres >nul 2>&1
    echo [信息] 已删除旧容器
)

REM 生成随机密码
set "DB_PASSWORD=%RANDOM%%RANDOM%%RANDOM%"
echo %DB_PASSWORD% > .postgres-password
echo [信息] 数据库密码已保存到 .postgres-password

REM 启动 PostgreSQL
echo [信息] 启动 PostgreSQL 容器...
docker run -d ^
    --name chat-studio-postgres ^
    --restart unless-stopped ^
    -e POSTGRES_DB=chat_studio ^
    -e POSTGRES_USER=chatuser ^
    -e POSTGRES_PASSWORD=%DB_PASSWORD% ^
    -p 5432:5432 ^
    -v chat-studio-postgres-data:/var/lib/postgresql/data ^
    postgres:15-alpine

if errorlevel 1 (
    echo [错误] PostgreSQL 启动失败
    pause
    exit /b 1
)

echo [信息] 等待 PostgreSQL 就绪...
timeout /t 5 /nobreak >nul

REM 等待数据库就绪
set MAX_ATTEMPTS=30
set ATTEMPT=0
:wait_postgres
docker exec chat-studio-postgres pg_isready -U chatuser -d chat_studio >nul 2>&1
if not errorlevel 1 goto postgres_ready
set /a ATTEMPT+=1
if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo [错误] PostgreSQL 启动超时
    pause
    exit /b 1
)
echo|set /p=.
timeout /t 1 /nobreak >nul
goto wait_postgres

:postgres_ready
echo.
echo [成功] PostgreSQL 已就绪
echo [信息] 连接字符串: postgresql://chatuser:%DB_PASSWORD%@localhost:5432/chat_studio
echo.

:skip_postgres

REM ==================== Redis ====================
echo ======================================================================
echo 设置 Redis
echo ======================================================================

REM 检查容器是否已存在
docker ps -a --format "{{.Names}}" | findstr /x "chat-studio-redis" >nul
if not errorlevel 1 (
    echo [警告] Redis 容器已存在
    choice /C YN /M "是否删除并重新创建"
    if errorlevel 2 goto skip_redis
    docker stop chat-studio-redis >nul 2>&1
    docker rm chat-studio-redis >nul 2>&1
    echo [信息] 已删除旧容器
)

REM 生成随机密码
set "REDIS_PASSWORD=%RANDOM%%RANDOM%%RANDOM%"
echo %REDIS_PASSWORD% > .redis-password
echo [信息] Redis 密码已保存到 .redis-password

REM 启动 Redis
echo [信息] 启动 Redis 容器...
docker run -d ^
    --name chat-studio-redis ^
    --restart unless-stopped ^
    -p 6379:6379 ^
    -v chat-studio-redis-data:/data ^
    redis:7-alpine ^
    redis-server --requirepass %REDIS_PASSWORD% --appendonly yes

if errorlevel 1 (
    echo [错误] Redis 启动失败
    pause
    exit /b 1
)

echo [信息] 等待 Redis 就绪...
timeout /t 3 /nobreak >nul

REM 等待 Redis 就绪
set MAX_ATTEMPTS=15
set ATTEMPT=0
:wait_redis
docker exec chat-studio-redis redis-cli -a %REDIS_PASSWORD% ping >nul 2>&1
if not errorlevel 1 goto redis_ready
set /a ATTEMPT+=1
if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo [错误] Redis 启动超时
    pause
    exit /b 1
)
echo|set /p=.
timeout /t 1 /nobreak >nul
goto wait_redis

:redis_ready
echo.
echo [成功] Redis 已就绪
echo [信息] 连接字符串: redis://:%REDIS_PASSWORD%@localhost:6379
echo.

:skip_redis

REM ==================== ChromaDB ====================
echo ======================================================================
echo 设置 ChromaDB
echo ======================================================================

REM 检查容器是否已存在
docker ps -a --format "{{.Names}}" | findstr /x "chat-studio-chroma" >nul
if not errorlevel 1 (
    echo [警告] ChromaDB 容器已存在
    choice /C YN /M "是否删除并重新创建"
    if errorlevel 2 goto skip_chroma
    docker stop chat-studio-chroma >nul 2>&1
    docker rm chat-studio-chroma >nul 2>&1
    echo [信息] 已删除旧容器
)

REM 创建数据目录
if not exist "data\chroma" mkdir data\chroma

REM 启动 ChromaDB
echo [信息] 启动 ChromaDB 容器...
docker run -d ^
    --name chat-studio-chroma ^
    --restart unless-stopped ^
    -p 8000:8000 ^
    -v chat-studio-chroma-data:/chroma/chroma ^
    -e IS_PERSISTENT=TRUE ^
    -e ANONYMIZED_TELEMETRY=FALSE ^
    chromadb/chroma:latest

if errorlevel 1 (
    echo [错误] ChromaDB 启动失败
    pause
    exit /b 1
)

echo [信息] 等待 ChromaDB 就绪...
timeout /t 5 /nobreak >nul

REM 等待 ChromaDB 就绪
set MAX_ATTEMPTS=20
set ATTEMPT=0
:wait_chroma
curl -f http://localhost:8000/api/v1/heartbeat >nul 2>&1
if not errorlevel 1 goto chroma_ready
set /a ATTEMPT+=1
if %ATTEMPT% geq %MAX_ATTEMPTS% (
    echo [错误] ChromaDB 启动超时
    pause
    exit /b 1
)
echo|set /p=.
timeout /t 1 /nobreak >nul
goto wait_chroma

:chroma_ready
echo.
echo [成功] ChromaDB 已就绪
echo [信息] API 地址: http://localhost:8000
echo.

:skip_chroma

REM ==================== 创建环境配置文件 ====================
echo ======================================================================
echo 创建环境配置文件
echo ======================================================================

if exist ".env.local" (
    echo [警告] .env.local 已存在，跳过创建
    goto skip_env
)

REM 读取密码
set /p DB_PASSWORD=<.postgres-password
set /p REDIS_PASSWORD=<.redis-password

REM 创建 .env.local
(
echo # ==================== 数据库配置 ====================
echo DATABASE_URL=postgresql://chatuser:%DB_PASSWORD%@localhost:5432/chat_studio
echo.
echo # ==================== Redis 配置 ====================
echo REDIS_URL=redis://:%REDIS_PASSWORD%@localhost:6379/0
echo REDIS_PASSWORD=%REDIS_PASSWORD%
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_MAX_CONNECTIONS=50
echo.
echo # ==================== ChromaDB 配置 ====================
echo CHROMA_HOST=localhost
echo CHROMA_PORT=8000
echo CHROMA_PERSIST_DIR=./data/chroma
echo USE_REMOTE_CHROMA=true
echo CHROMA_HTTP_HOST=http://localhost:8000
echo.
echo # ==================== 应用配置 ====================
echo NODE_ENV=development
echo LOG_LEVEL=debug
) > .env.local

echo [成功] 已创建 .env.local
echo.

:skip_env

REM ==================== 显示服务状态 ====================
echo ======================================================================
echo 服务状态
echo ======================================================================

docker ps --filter "name=chat-studio-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

REM ==================== 显示连接信息 ====================
echo ======================================================================
echo 连接信息
echo ======================================================================
echo.

if exist ".postgres-password" (
    set /p DB_PASSWORD=<.postgres-password
    echo PostgreSQL:
    echo   Host: localhost
    echo   Port: 5432
    echo   Database: chat_studio
    echo   User: chatuser
    echo   Password: !DB_PASSWORD!
    echo   Connection: postgresql://chatuser:!DB_PASSWORD!@localhost:5432/chat_studio
    echo.
)

if exist ".redis-password" (
    set /p REDIS_PASSWORD=<.redis-password
    echo Redis:
    echo   Host: localhost
    echo   Port: 6379
    echo   Password: !REDIS_PASSWORD!
    echo   Connection: redis://:!REDIS_PASSWORD!@localhost:6379
    echo.
)

echo ChromaDB:
echo   Host: localhost
echo   Port: 8000
echo   API: http://localhost:8000
echo.

REM ==================== 显示下一步操作 ====================
echo ======================================================================
echo 下一步操作
echo ======================================================================
echo.
echo 1. 复制 .env.local 到后端目录:
echo    copy .env.local backend\.env
echo.
echo 2. 安装 Python 依赖:
echo    cd backend
echo    pip install -r requirements.txt
echo.
echo 3. 启动后端服务:
echo    cd backend
echo    python main.py
echo.
echo 4. 启动前端开发服务器:
echo    npm run dev
echo.
echo 管理命令:
echo   查看日志:  docker logs -f ^<container-name^>
echo   停止服务:  docker stop ^<container-name^>
echo   启动服务:  docker start ^<container-name^>
echo   重启服务:  docker restart ^<container-name^>
echo.
echo [信息] 所有服务密码保存在 .postgres-password 和 .redis-password 文件中
echo [警告] 请妥善保管密码文件，不要提交到版本控制系统！
echo.

echo ======================================================================
echo [成功] 所有服务设置完成！
echo ======================================================================
echo.

pause
