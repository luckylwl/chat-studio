"""
AI Chat Studio - FastAPI Backend
完整的Python后端服务

功能:
- RESTful API
- WebSocket实时通信
- JWT认证
- 对话持久化
- AI模型集成
- 缓存系统
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import uvicorn
import asyncio
import json
import jwt
import hashlib
import os
import time
from enum import Enum
from dotenv import load_dotenv
from collections import defaultdict

# 加载环境变量
load_dotenv()

# 配置
SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY or JWT_SECRET must be set in environment variables")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# ==================== API 限流中间件 ====================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    API 限流中间件
    - 基于 IP 地址的速率限制
    - 滑动窗口算法
    - 可配置限流规则
    """
    def __init__(self, app, rate_limit: int = 100, time_window: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit  # 时间窗口内的最大请求数
        self.time_window = time_window  # 时间窗口（秒）
        self.requests: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # 获取客户端 IP
        client_ip = request.client.host if request.client else "unknown"

        # 排除某些端点（健康检查、文档等）
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        current_time = time.time()

        # 清理过期的请求记录
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if current_time - req_time < self.time_window
        ]

        # 检查是否超过限流
        if len(self.requests[client_ip]) >= self.rate_limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"速率限制: 每{self.time_window}秒最多{self.rate_limit}个请求",
                    "retry_after": self.time_window
                }
            )

        # 记录当前请求
        self.requests[client_ip].append(current_time)

        # 添加限流头部
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(
            self.rate_limit - len(self.requests[client_ip])
        )
        response.headers["X-RateLimit-Reset"] = str(
            int(current_time + self.time_window)
        )

        return response

# ==================== 请求日志中间件 ====================

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    请求日志中间件
    - 记录所有API请求
    - 记录响应时间
    - 记录错误
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # 记录请求信息
        print(f"📥 {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # 添加处理时间头部
            response.headers["X-Process-Time"] = f"{process_time:.4f}"

            # 记录响应信息
            status_emoji = "✅" if response.status_code < 400 else "❌"
            print(f"{status_emoji} {request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")

            return response
        except Exception as e:
            process_time = time.time() - start_time
            print(f"❌ {request.method} {request.url.path} - ERROR - {process_time:.4f}s - {str(e)}")
            raise

# ==================== FastAPI 应用配置 ====================

# 创建FastAPI应用
app = FastAPI(
    title="AI Chat Studio API",
    description="完整的AI聊天应用后端服务",
    version="2.3.0"
)

# CORS配置
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求日志中间件
app.add_middleware(LoggingMiddleware)

# 添加API限流中间件 (每60秒最多100个请求)
RATE_LIMIT = int(os.getenv("RATE_LIMIT", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
app.add_middleware(RateLimitMiddleware, rate_limit=RATE_LIMIT, time_window=RATE_LIMIT_WINDOW)

# 安全认证
security = HTTPBearer()

# ==================== 数据模型 ====================

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class Message(BaseModel):
    id: str
    content: str
    role: MessageRole
    timestamp: int
    model: Optional[str] = None
    tokens: Optional[int] = None

class Conversation(BaseModel):
    id: str
    title: str
    messages: List[Message] = []
    createdAt: int
    updatedAt: int
    model: str
    systemPrompt: Optional[str] = None
    userId: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-3.5-turbo"
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=4096)
    stream: bool = False

class User(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ==================== 内存数据库 (生产环境应使用真实数据库) ====================

# 用户数据
users_db: Dict[str, Dict[str, Any]] = {}

# 对话数据
conversations_db: Dict[str, List[Conversation]] = {}

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"用户 {user_id} 已连接")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"用户 {user_id} 已断开")

    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# ==================== 工具函数 ====================

def hash_password(password: str) -> str:
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """获取当前用户"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证凭据"
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token已过期"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无法验证凭据"
        )

# ==================== API端点 ====================

@app.get("/")
async def root():
    """根端点"""
    return {
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

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "active_connections": len(manager.active_connections),
        "total_users": len(users_db),
        "total_conversations": sum(len(convs) for convs in conversations_db.values())
    }

# ==================== 认证端点 ====================

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserRegister):
    """用户注册"""
    # 检查用户名是否已存在
    if any(u.get("username") == user.username for u in users_db.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    # 创建用户
    user_id = f"user_{len(users_db) + 1}"
    users_db[user_id] = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow().isoformat()
    }

    # 创建Token
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token}

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    """用户登录"""
    # 查找用户
    user_data = None
    user_id = None
    for uid, data in users_db.items():
        if data.get("username") == user.username:
            user_data = data
            user_id = uid
            break

    if not user_data or not verify_password(user.password, user_data["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 创建Token
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token}

@app.get("/api/auth/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """获取当前用户信息"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    user_data = users_db[user_id].copy()
    user_data.pop("password")  # 不返回密码
    return user_data

# ==================== 对话端点 ====================

@app.get("/api/conversations")
async def get_conversations(user_id: str = Depends(get_current_user)):
    """获取用户的所有对话"""
    return conversations_db.get(user_id, [])

@app.post("/api/conversations")
async def create_conversation(
    conversation: Conversation,
    user_id: str = Depends(get_current_user)
):
    """创建新对话"""
    conversation.userId = user_id

    if user_id not in conversations_db:
        conversations_db[user_id] = []

    conversations_db[user_id].append(conversation)

    return conversation

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """获取特定对话"""
    user_conversations = conversations_db.get(user_id, [])

    for conv in user_conversations:
        if conv.id == conversation_id:
            return conv

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="对话不存在"
    )

@app.put("/api/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    updated_conversation: Conversation,
    user_id: str = Depends(get_current_user)
):
    """更新对话"""
    user_conversations = conversations_db.get(user_id, [])

    for i, conv in enumerate(user_conversations):
        if conv.id == conversation_id:
            updated_conversation.userId = user_id
            user_conversations[i] = updated_conversation
            return updated_conversation

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="对话不存在"
    )

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """删除对话"""
    user_conversations = conversations_db.get(user_id, [])

    for i, conv in enumerate(user_conversations):
        if conv.id == conversation_id:
            del user_conversations[i]
            return {"message": "对话已删除"}

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="对话不存在"
    )

# ==================== 聊天端点 ====================

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    """
    发送聊天消息
    注意: 这是一个模拟端点，实际应该调用真实的AI API (OpenAI, Anthropic等)
    """

    # 模拟AI响应
    import time
    time.sleep(0.5)  # 模拟处理时间

    # 简单的模拟响应
    last_message = request.messages[-1].content if request.messages else ""

    response_content = f"这是一个模拟的AI响应。你说: '{last_message}'"

    if "你好" in last_message or "hello" in last_message.lower():
        response_content = "你好! 我是AI助手，很高兴为你服务!"
    elif "帮助" in last_message or "help" in last_message.lower():
        response_content = "我可以帮你解答问题、编写代码、翻译文本等。请告诉我你需要什么帮助!"

    return {
        "content": response_content,
        "tokens": len(response_content),
        "model": request.model
    }

# ==================== WebSocket端点 ====================

async def verify_websocket_token(token: str) -> Optional[str]:
    """验证 WebSocket Token 并返回 user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except (jwt.ExpiredSignatureError, jwt.JWTError):
        return None

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: Optional[str] = None):
    """
    WebSocket实时通信 (带认证)

    使用方式:
    1. 通过查询参数传递 token: ws://host/ws/user123?token=xxx
    2. 通过第一条消息传递 token: {"type": "auth", "token": "xxx"}
    """
    # 先接受连接
    await websocket.accept()

    authenticated = False
    authenticated_user_id = None

    # 方式1: 通过查询参数认证
    if token:
        authenticated_user_id = await verify_websocket_token(token)
        if authenticated_user_id == user_id:
            authenticated = True
            await manager.connect(user_id, websocket)
            await manager.send_message(user_id, {
                "type": "auth_success",
                "message": "认证成功"
            })

    try:
        while True:
            # 接收消息
            data = await websocket.receive_json()
            message_type = data.get("type")

            # 方式2: 通过首条消息认证
            if message_type == "auth" and not authenticated:
                auth_token = data.get("token")
                if auth_token:
                    authenticated_user_id = await verify_websocket_token(auth_token)
                    if authenticated_user_id == user_id:
                        authenticated = True
                        await manager.connect(user_id, websocket)
                        await manager.send_message(user_id, {
                            "type": "auth_success",
                            "message": "认证成功"
                        })
                    else:
                        await manager.send_message(user_id, {
                            "type": "auth_failed",
                            "message": "认证失败: Token 无效或已过期"
                        })
                        await websocket.close(code=4001)
                        return
                else:
                    await manager.send_message(user_id, {
                        "type": "auth_failed",
                        "message": "认证失败: 缺少 token"
                    })
                    await websocket.close(code=4001)
                    return
                continue

            # 检查是否已认证
            if not authenticated:
                await websocket.send_json({
                    "type": "error",
                    "message": "未认证，请先发送认证消息"
                })
                continue

            if message_type == "ping":
                # 心跳检测
                await manager.send_message(user_id, {"type": "pong"})

            elif message_type == "chat":
                # 实时聊天
                content = data.get("content", "")

                # 模拟AI流式响应
                response = f"实时响应: {content}"

                # 分块发送
                for i in range(0, len(response), 10):
                    chunk = response[i:i+10]
                    await manager.send_message(user_id, {
                        "type": "chat_chunk",
                        "content": chunk
                    })
                    await asyncio.sleep(0.1)  # 模拟流式效果

                # 发送完成信号
                await manager.send_message(user_id, {
                    "type": "chat_complete"
                })

            elif message_type == "typing":
                # 打字状态
                await manager.broadcast({
                    "type": "user_typing",
                    "user_id": user_id
                })

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast({
            "type": "user_disconnected",
            "user_id": user_id
        })

# ==================== 统计端点 ====================

@app.get("/api/stats")
async def get_stats(user_id: str = Depends(get_current_user)):
    """获取用户基础统计信息"""
    user_conversations = conversations_db.get(user_id, [])

    total_messages = sum(len(conv.messages) for conv in user_conversations)
    total_tokens = sum(
        sum(msg.tokens or 0 for msg in conv.messages)
        for conv in user_conversations
    )

    return {
        "total_conversations": len(user_conversations),
        "total_messages": total_messages,
        "total_tokens": total_tokens,
        "average_messages_per_conversation": (
            total_messages / len(user_conversations) if user_conversations else 0
        )
    }

@app.get("/api/stats/detailed")
async def get_detailed_stats(user_id: str = Depends(get_current_user)):
    """
    获取用户详细统计信息

    包含:
    - 模型使用统计
    - 时间分布
    - 消息角色分布
    - Token 消耗趋势
    - 对话活跃度
    """
    user_conversations = conversations_db.get(user_id, [])

    # 基础统计
    total_conversations = len(user_conversations)
    total_messages = sum(len(conv.messages) for conv in user_conversations)
    total_tokens = sum(
        sum(msg.tokens or 0 for msg in conv.messages)
        for conv in user_conversations
    )

    # 模型使用统计
    model_usage = defaultdict(int)
    for conv in user_conversations:
        model_usage[conv.model] += 1

    # 消息角色分布
    role_distribution = defaultdict(int)
    for conv in user_conversations:
        for msg in conv.messages:
            role_distribution[msg.role] += 1

    # 时间分布 (按小时)
    hourly_distribution = defaultdict(int)
    daily_messages = defaultdict(int)

    for conv in user_conversations:
        for msg in conv.messages:
            msg_time = datetime.fromtimestamp(msg.timestamp / 1000)
            hourly_distribution[msg_time.hour] += 1
            day_key = msg_time.strftime("%Y-%m-%d")
            daily_messages[day_key] += 1

    # Token 消耗趋势 (最近 7 天)
    token_trend = defaultdict(int)
    now = datetime.utcnow()
    for conv in user_conversations:
        for msg in conv.messages:
            if msg.tokens:
                msg_time = datetime.fromtimestamp(msg.timestamp / 1000)
                days_ago = (now - msg_time).days
                if days_ago < 7:
                    date_key = msg_time.strftime("%Y-%m-%d")
                    token_trend[date_key] += msg.tokens

    # 对话活跃度 (最近更新的对话)
    active_conversations = sorted(
        user_conversations,
        key=lambda c: c.updatedAt,
        reverse=True
    )[:10]

    active_conv_stats = [
        {
            "id": conv.id,
            "title": conv.title,
            "message_count": len(conv.messages),
            "last_updated": conv.updatedAt,
            "model": conv.model
        }
        for conv in active_conversations
    ]

    # 平均响应长度
    assistant_messages = [
        msg for conv in user_conversations
        for msg in conv.messages
        if msg.role == MessageRole.ASSISTANT
    ]
    avg_response_length = (
        sum(len(msg.content) for msg in assistant_messages) / len(assistant_messages)
        if assistant_messages else 0
    )

    return {
        "basic": {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_tokens": total_tokens,
            "average_messages_per_conversation": (
                total_messages / total_conversations if total_conversations else 0
            )
        },
        "model_usage": dict(model_usage),
        "role_distribution": dict(role_distribution),
        "hourly_distribution": dict(hourly_distribution),
        "daily_messages_last_30_days": dict(sorted(daily_messages.items(), reverse=True)[:30]),
        "token_trend_last_7_days": dict(sorted(token_trend.items())),
        "active_conversations": active_conv_stats,
        "insights": {
            "average_response_length": round(avg_response_length, 2),
            "most_used_model": max(model_usage.items(), key=lambda x: x[1])[0] if model_usage else None,
            "peak_hour": max(hourly_distribution.items(), key=lambda x: x[1])[0] if hourly_distribution else None,
            "total_conversations_this_week": sum(
                1 for conv in user_conversations
                if (now - datetime.fromtimestamp(conv.createdAt / 1000)).days < 7
            )
        }
    }

# ==================== 主函数 ====================

if __name__ == "__main__":
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    RELOAD = os.getenv("RELOAD", "true").lower() == "true"

    print("🚀 启动 AI Chat Studio Backend...")
    print(f"📝 API文档: http://{HOST}:{PORT}/docs")
    print(f"🔌 WebSocket: ws://{HOST}:{PORT}/ws/{{user_id}}")

    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=RELOAD,
        log_level=os.getenv("LOG_LEVEL", "info")
    )
