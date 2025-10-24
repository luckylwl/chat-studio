# AI Chat Studio - Backend Integration Guide

## 📚 目录

1. [环境设置](#环境设置)
2. [快速开始](#快速开始)
3. [API端点文档](#api端点文档)
4. [WebSocket集成](#websocket集成)
5. [前端集成](#前端集成)
6. [测试指南](#测试指南)
7. [生产部署](#生产部署)
8. [故障排查](#故障排查)

---

## 🚀 环境设置

### 前置要求

- Python 3.9 或更高版本
- pip (Python包管理器)
- Node.js 16+ (用于前端)

### 安装Python (如果尚未安装)

**Windows:**
```bash
# 从 https://www.python.org/downloads/ 下载安装包
# 或使用 Chocolatey
choco install python

# 验证安装
python --version
pip --version
```

**macOS:**
```bash
# 使用 Homebrew
brew install python@3.11

# 验证安装
python3 --version
pip3 --version
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# Fedora
sudo dnf install python3 python3-pip

# 验证安装
python3 --version
pip3 --version
```

---

## 🏃 快速开始

### 1. 安装依赖

```bash
# 进入backend目录
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 或使用虚拟环境 (推荐)
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动后端服务器

```bash
# 方法1: 直接运行
python main.py

# 方法2: 使用uvicorn (更多控制)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 方法3: 生产环境
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

服务器启动后，你会看到:
```
🚀 启动 AI Chat Studio Backend...
📝 API文档: http://localhost:8000/docs
🔌 WebSocket: ws://localhost:8000/ws/{user_id}
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. 运行测试

```bash
# 在另一个终端窗口运行
python test_api.py
```

你会看到彩色输出显示每个测试的结果。

### 4. 访问API文档

打开浏览器访问:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📡 API端点文档

### 基础端点

#### `GET /` - 根端点
返回API基本信息和可用端点列表。

**响应:**
```json
{
  "name": "AI Chat Studio API",
  "version": "2.0.0",
  "status": "running",
  "endpoints": {
    "auth": "/api/auth",
    "chat": "/api/chat",
    "conversations": "/api/conversations",
    "websocket": "/ws",
    "docs": "/docs"
  }
}
```

#### `GET /health` - 健康检查
监控服务状态和统计信息。

**响应:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "active_connections": 5,
  "total_users": 12,
  "total_conversations": 45
}
```

---

### 认证端点

#### `POST /api/auth/register` - 用户注册

**请求体:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123"
}
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**状态码:**
- `200` - 注册成功
- `400` - 用户名已存在
- `422` - 验证错误

#### `POST /api/auth/login` - 用户登录

**请求体:**
```json
{
  "username": "testuser",
  "password": "securepassword123"
}
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**状态码:**
- `200` - 登录成功
- `401` - 用户名或密码错误

#### `GET /api/auth/me` - 获取当前用户信息

**请求头:**
```
Authorization: Bearer <access_token>
```

**响应:**
```json
{
  "id": "user_1",
  "username": "testuser",
  "email": "test@example.com",
  "created_at": "2025-10-16T10:00:00"
}
```

**状态码:**
- `200` - 成功
- `401` - 未授权/Token无效
- `404` - 用户不存在

---

### 对话端点

#### `GET /api/conversations` - 获取所有对话

**请求头:**
```
Authorization: Bearer <access_token>
```

**响应:**
```json
[
  {
    "id": "conv_1",
    "title": "关于React的讨论",
    "messages": [...],
    "createdAt": 1697467200000,
    "updatedAt": 1697467300000,
    "model": "gpt-3.5-turbo",
    "systemPrompt": "你是一个AI助手",
    "userId": "user_1"
  }
]
```

#### `POST /api/conversations` - 创建新对话

**请求头:**
```
Authorization: Bearer <access_token>
```

**请求体:**
```json
{
  "id": "conv_123",
  "title": "新对话",
  "messages": [],
  "createdAt": 1697467200000,
  "updatedAt": 1697467200000,
  "model": "gpt-3.5-turbo",
  "userId": "user_1"
}
```

**响应:** 返回创建的对话对象

#### `GET /api/conversations/{conversation_id}` - 获取特定对话

**请求头:**
```
Authorization: Bearer <access_token>
```

**响应:** 返回对话对象或404

#### `PUT /api/conversations/{conversation_id}` - 更新对话

**请求头:**
```
Authorization: Bearer <access_token>
```

**请求体:** 完整的对话对象

**响应:** 返回更新后的对话对象

#### `DELETE /api/conversations/{conversation_id}` - 删除对话

**请求头:**
```
Authorization: Bearer <access_token>
```

**响应:**
```json
{
  "message": "对话已删除"
}
```

---

### 聊天端点

#### `POST /api/chat` - 发送聊天消息

**请求头:**
```
Authorization: Bearer <access_token>
```

**请求体:**
```json
{
  "messages": [
    {
      "id": "msg1",
      "content": "你好，请介绍一下React",
      "role": "user",
      "timestamp": 1697467200000
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**响应:**
```json
{
  "content": "React是一个用于构建用户界面的JavaScript库...",
  "tokens": 150,
  "model": "gpt-3.5-turbo"
}
```

**参数说明:**
- `messages`: 消息数组
- `model`: AI模型名称
- `temperature`: 创造性参数 (0-2)
- `max_tokens`: 最大token数 (1-4096)
- `stream`: 是否使用流式响应

---

### 统计端点

#### `GET /api/stats` - 获取用户统计

**请求头:**
```
Authorization: Bearer <access_token>
```

**响应:**
```json
{
  "total_conversations": 15,
  "total_messages": 234,
  "total_tokens": 45678,
  "average_messages_per_conversation": 15.6
}
```

---

## 🔌 WebSocket集成

### 连接WebSocket

```javascript
// 建立WebSocket连接
const userId = 'user_123'
const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`)

ws.onopen = () => {
  console.log('WebSocket已连接')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  handleWebSocketMessage(data)
}

ws.onerror = (error) => {
  console.error('WebSocket错误:', error)
}

ws.onclose = () => {
  console.log('WebSocket已断开')
}
```

### WebSocket消息类型

#### 1. 心跳检测 (Ping/Pong)

**发送:**
```json
{
  "type": "ping"
}
```

**接收:**
```json
{
  "type": "pong"
}
```

#### 2. 实时聊天

**发送:**
```json
{
  "type": "chat",
  "content": "你好，这是一条实时消息"
}
```

**接收 (流式响应):**
```json
{
  "type": "chat_chunk",
  "content": "实时响应: 你好"
}
```

**完成信号:**
```json
{
  "type": "chat_complete"
}
```

#### 3. 打字状态

**发送:**
```json
{
  "type": "typing"
}
```

**广播给其他用户:**
```json
{
  "type": "user_typing",
  "user_id": "user_123"
}
```

---

## 🎨 前端集成

### 创建API Service

```typescript
// src/services/backendApi.ts
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export class BackendApiService {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    }
  }

  // 认证
  async register(username: string, email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username,
      email,
      password
    })
    this.token = response.data.access_token
    return response.data
  }

  async login(username: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password
    })
    this.token = response.data.access_token
    return response.data
  }

  async getCurrentUser() {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  // 对话
  async getConversations() {
    const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
      headers: this.getHeaders()
    })
    return response.data
  }

  async createConversation(conversation: any) {
    const response = await axios.post(
      `${API_BASE_URL}/api/conversations`,
      conversation,
      { headers: this.getHeaders() }
    )
    return response.data
  }

  async updateConversation(id: string, conversation: any) {
    const response = await axios.put(
      `${API_BASE_URL}/api/conversations/${id}`,
      conversation,
      { headers: this.getHeaders() }
    )
    return response.data
  }

  async deleteConversation(id: string) {
    const response = await axios.delete(
      `${API_BASE_URL}/api/conversations/${id}`,
      { headers: this.getHeaders() }
    )
    return response.data
  }

  // 聊天
  async sendMessage(messages: any[], options: any = {}) {
    const response = await axios.post(
      `${API_BASE_URL}/api/chat`,
      {
        messages,
        model: options.model || 'gpt-3.5-turbo',
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: options.stream || false
      },
      { headers: this.getHeaders() }
    )
    return response.data
  }

  // 统计
  async getStats() {
    const response = await axios.get(`${API_BASE_URL}/api/stats`, {
      headers: this.getHeaders()
    })
    return response.data
  }
}

export const backendApi = new BackendApiService()
```

### WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react'

interface WebSocketMessage {
  type: string
  content?: string
  user_id?: string
}

export const useWebSocket = (userId: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`)

    ws.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')

      // 发送心跳
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)

      ws.onclose = () => {
        clearInterval(pingInterval)
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, data])
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [userId])

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  const sendChat = (content: string) => {
    sendMessage({ type: 'chat', content })
  }

  const sendTyping = () => {
    sendMessage({ type: 'typing' })
  }

  return {
    isConnected,
    messages,
    sendChat,
    sendTyping,
    sendMessage
  }
}
```

### 在React组件中使用

```typescript
import { useWebSocket } from '@/hooks/useWebSocket'
import { backendApi } from '@/services/backendApi'

function ChatComponent() {
  const { isConnected, messages, sendChat } = useWebSocket('user_123')

  const handleLogin = async () => {
    try {
      const result = await backendApi.login('testuser', 'password123')
      console.log('登录成功:', result)
    } catch (error) {
      console.error('登录失败:', error)
    }
  }

  const handleSendMessage = async () => {
    // 方法1: 使用REST API
    const response = await backendApi.sendMessage([
      { id: '1', content: '你好', role: 'user', timestamp: Date.now() }
    ])
    console.log('AI响应:', response.content)

    // 方法2: 使用WebSocket (实时)
    sendChat('你好，这是实时消息')
  }

  return (
    <div>
      <div>WebSocket状态: {isConnected ? '已连接' : '未连接'}</div>
      <button onClick={handleLogin}>登录</button>
      <button onClick={handleSendMessage}>发送消息</button>
    </div>
  )
}
```

---

## 🧪 测试指南

### 运行自动化测试

```bash
python test_api.py
```

### 测试覆盖

测试脚本会自动测试以下端点:

1. ✓ 健康检查 (`/health`)
2. ✓ 用户注册 (`/api/auth/register`)
3. ✓ 获取用户信息 (`/api/auth/me`)
4. ✓ 创建对话 (`/api/conversations`)
5. ✓ 获取对话列表 (`/api/conversations`)
6. ✓ 聊天API (`/api/chat`)
7. ✓ 统计信息 (`/api/stats`)

### 手动测试 (使用curl)

**健康检查:**
```bash
curl http://localhost:8000/health
```

**用户注册:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**发送聊天消息:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [
      {"id": "1", "content": "你好", "role": "user", "timestamp": 1697467200000}
    ],
    "model": "gpt-3.5-turbo"
  }'
```

### 使用Postman

1. 导入API端点到Postman
2. 设置环境变量:
   - `base_url`: http://localhost:8000
   - `token`: (从登录响应中获取)
3. 创建请求集合并测试所有端点

---

## 🚀 生产部署

### 环境变量配置

创建 `.env` 文件:

```bash
# 服务器配置
HOST=0.0.0.0
PORT=8000
WORKERS=4

# 安全配置
SECRET_KEY=your-very-secure-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 数据库配置 (可选)
DATABASE_URL=postgresql://user:password@localhost:5432/chatdb

# Redis配置 (可选)
REDIS_URL=redis://localhost:6379/0

# AI API配置
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 更新main.py以使用环境变量

```python
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# CORS配置
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 使用Docker部署

创建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - postgres
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=chatdb
      - POSTGRES_USER=chatuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**部署命令:**
```bash
docker-compose up -d
```

### 使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket支持
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### 使用systemd管理服务

创建 `/etc/systemd/system/chatbackend.service`:

```ini
[Unit]
Description=AI Chat Studio Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/chat-studio/backend
Environment="PATH=/var/www/chat-studio/backend/venv/bin"
ExecStart=/var/www/chat-studio/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

**启动服务:**
```bash
sudo systemctl start chatbackend
sudo systemctl enable chatbackend
sudo systemctl status chatbackend
```

---

## 🔧 故障排查

### 常见问题

#### 1. 端口已被占用

**错误:**
```
Error: [Errno 48] Address already in use
```

**解决:**
```bash
# 查找占用端口的进程
lsof -i :8000
# 或
netstat -ano | findstr :8000

# 杀死进程
kill -9 <PID>

# 或使用不同端口
uvicorn main:app --port 8001
```

#### 2. CORS错误

**错误:**
```
Access to fetch at 'http://localhost:8000/api/chat' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决:**
确保在main.py中添加了正确的CORS配置:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. JWT Token过期

**错误:**
```
401 Unauthorized: Token已过期
```

**解决:**
- 重新登录获取新token
- 或调整过期时间:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24小时
```

#### 4. WebSocket连接失败

**错误:**
```
WebSocket connection failed
```

**解决:**
- 确保服务器正在运行
- 检查WebSocket URL格式: `ws://localhost:8000/ws/{user_id}`
- 检查防火墙设置
- 如果使用HTTPS，WebSocket也需要使用WSS

#### 5. 依赖安装失败

**错误:**
```
ERROR: Could not find a version that satisfies the requirement...
```

**解决:**
```bash
# 升级pip
pip install --upgrade pip

# 逐个安装依赖
pip install fastapi
pip install uvicorn[standard]
# ... 其他依赖

# 或使用不同的镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 调试技巧

#### 启用详细日志

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

#### 使用FastAPI调试模式

```bash
uvicorn main:app --reload --log-level debug
```

#### 检查请求/响应

在端点中添加日志:
```python
@app.post("/api/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    logger.debug(f"收到聊天请求: user={user_id}, messages={len(request.messages)}")
    # ... 处理逻辑
    logger.debug(f"返回响应: content_length={len(response_content)}")
    return response
```

---

## 📊 性能优化

### 1. 使用连接池

```python
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40
)
```

### 2. 启用响应压缩

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 3. 实现请求缓存

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_cached_response(query: str):
    # 缓存AI响应
    pass
```

### 4. 使用异步操作

```python
import asyncio
import httpx

async def call_multiple_apis():
    async with httpx.AsyncClient() as client:
        tasks = [
            client.get('https://api1.example.com'),
            client.get('https://api2.example.com'),
        ]
        results = await asyncio.gather(*tasks)
    return results
```

---

## 🎯 下一步

完成后端集成后，你可以:

1. **集成真实AI API**
   - OpenAI GPT-4
   - Anthropic Claude
   - Google PaLM

2. **添加数据库**
   - PostgreSQL (推荐)
   - MongoDB
   - SQLite (开发环境)

3. **实现缓存层**
   - Redis
   - Memcached

4. **添加监控**
   - Prometheus + Grafana
   - Sentry错误追踪
   - ELK日志分析

5. **实现认证增强**
   - OAuth2 (Google, GitHub)
   - 双因素认证
   - 刷新Token

6. **添加限流**
   - slowapi
   - Redis限流

---

## 📞 支持

如有问题或建议，请:
- 查看API文档: http://localhost:8000/docs
- 检查日志输出
- 参考本指南的故障排查部分

祝开发愉快! 🚀
