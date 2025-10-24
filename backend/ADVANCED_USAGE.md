# 🚀 AI Chat Studio Backend - 高级使用指南

完整的后端高级功能使用教程，包含最佳实践、性能调优和生产环境配置。

---

## 📚 目录

1. [高级 API 使用](#高级-api-使用)
2. [WebSocket 高级特性](#websocket-高级特性)
3. [数据库集成](#数据库集成)
4. [缓存策略](#缓存策略)
5. [AI API 集成](#ai-api-集成)
6. [性能调优](#性能调优)
7. [安全最佳实践](#安全最佳实践)
8. [监控和日志](#监控和日志)
9. [扩展和插件](#扩展和插件)
10. [常见问题和解决方案](#常见问题和解决方案)

---

## 🎯 高级 API 使用

### 批量操作

#### 批量创建对话

```python
from typing import List
from fastapi import APIRouter

router = APIRouter()

@router.post("/api/conversations/batch")
async def batch_create_conversations(
    conversations: List[Conversation],
    user_id: str = Depends(get_current_user)
):
    """批量创建对话"""
    created_conversations = []

    for conversation in conversations:
        conversation.userId = user_id

        if user_id not in conversations_db:
            conversations_db[user_id] = []

        conversations_db[user_id].append(conversation)
        created_conversations.append(conversation)

    return {
        "success": True,
        "count": len(created_conversations),
        "conversations": created_conversations
    }
```

**使用示例:**
```bash
curl -X POST http://localhost:8000/api/conversations/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "conv_1",
      "title": "对话 1",
      "messages": [],
      "createdAt": 1697467200000,
      "updatedAt": 1697467200000,
      "model": "gpt-3.5-turbo",
      "userId": "user_1"
    },
    {
      "id": "conv_2",
      "title": "对话 2",
      "messages": [],
      "createdAt": 1697467200000,
      "updatedAt": 1697467200000,
      "model": "gpt-4",
      "userId": "user_1"
    }
  ]'
```

#### 批量删除对话

```python
@router.delete("/api/conversations/batch")
async def batch_delete_conversations(
    conversation_ids: List[str],
    user_id: str = Depends(get_current_user)
):
    """批量删除对话"""
    user_conversations = conversations_db.get(user_id, [])
    deleted_count = 0

    conversations_db[user_id] = [
        conv for conv in user_conversations
        if conv.id not in conversation_ids
    ]

    deleted_count = len(user_conversations) - len(conversations_db[user_id])

    return {
        "success": True,
        "deleted_count": deleted_count
    }
```

### 高级搜索

#### 全文搜索对话

```python
from typing import Optional

@router.get("/api/search")
async def search_conversations(
    query: str,
    model: Optional[str] = None,
    date_from: Optional[int] = None,
    date_to: Optional[int] = None,
    user_id: str = Depends(get_current_user)
):
    """
    高级搜索对话

    参数:
    - query: 搜索关键词
    - model: 过滤模型
    - date_from: 起始时间戳
    - date_to: 结束时间戳
    """
    user_conversations = conversations_db.get(user_id, [])
    results = []

    for conv in user_conversations:
        # 模型过滤
        if model and conv.model != model:
            continue

        # 日期过滤
        if date_from and conv.createdAt < date_from:
            continue
        if date_to and conv.createdAt > date_to:
            continue

        # 搜索标题和消息内容
        if query.lower() in conv.title.lower():
            results.append({
                "conversation": conv,
                "match_type": "title"
            })
            continue

        for message in conv.messages:
            if query.lower() in message.content.lower():
                results.append({
                    "conversation": conv,
                    "match_type": "message",
                    "matched_message": message
                })
                break

    return {
        "query": query,
        "count": len(results),
        "results": results
    }
```

**使用示例:**
```bash
curl "http://localhost:8000/api/search?query=React&model=gpt-4&date_from=1697467200000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 分页和排序

```python
from enum import Enum

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class SortBy(str, Enum):
    CREATED_AT = "createdAt"
    UPDATED_AT = "updatedAt"
    TITLE = "title"

@router.get("/api/conversations/paginated")
async def get_paginated_conversations(
    page: int = 1,
    page_size: int = 20,
    sort_by: SortBy = SortBy.UPDATED_AT,
    sort_order: SortOrder = SortOrder.DESC,
    user_id: str = Depends(get_current_user)
):
    """
    分页获取对话列表

    参数:
    - page: 页码 (从1开始)
    - page_size: 每页数量 (默认20, 最大100)
    - sort_by: 排序字段
    - sort_order: 排序顺序
    """
    # 限制每页最大数量
    page_size = min(page_size, 100)

    user_conversations = conversations_db.get(user_id, [])

    # 排序
    reverse = (sort_order == SortOrder.DESC)
    sorted_conversations = sorted(
        user_conversations,
        key=lambda x: getattr(x, sort_by.value),
        reverse=reverse
    )

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    paginated = sorted_conversations[start:end]

    return {
        "page": page,
        "page_size": page_size,
        "total": len(user_conversations),
        "total_pages": (len(user_conversations) + page_size - 1) // page_size,
        "conversations": paginated
    }
```

---

## 🔌 WebSocket 高级特性

### 房间管理

```python
from typing import Dict, Set

class RoomManager:
    """WebSocket 房间管理器"""

    def __init__(self):
        self.rooms: Dict[str, Set[str]] = {}
        self.user_rooms: Dict[str, Set[str]] = {}

    def create_room(self, room_id: str):
        """创建房间"""
        if room_id not in self.rooms:
            self.rooms[room_id] = set()

    def join_room(self, room_id: str, user_id: str):
        """用户加入房间"""
        self.create_room(room_id)
        self.rooms[room_id].add(user_id)

        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)

    def leave_room(self, room_id: str, user_id: str):
        """用户离开房间"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)

        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)

    def get_room_users(self, room_id: str) -> Set[str]:
        """获取房间内的用户"""
        return self.rooms.get(room_id, set())

    async def broadcast_to_room(self, room_id: str, message: dict):
        """向房间广播消息"""
        users = self.get_room_users(room_id)
        for user_id in users:
            await manager.send_message(user_id, message)

room_manager = RoomManager()

@app.websocket("/ws/room/{room_id}/{user_id}")
async def websocket_room_endpoint(
    websocket: WebSocket,
    room_id: str,
    user_id: str
):
    """房间 WebSocket 端点"""
    await manager.connect(user_id, websocket)
    room_manager.join_room(room_id, user_id)

    # 通知其他用户
    await room_manager.broadcast_to_room(room_id, {
        "type": "user_joined",
        "user_id": user_id,
        "room_id": room_id
    })

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "chat":
                # 广播聊天消息到房间
                await room_manager.broadcast_to_room(room_id, {
                    "type": "chat_message",
                    "user_id": user_id,
                    "content": data.get("content"),
                    "timestamp": int(time.time() * 1000)
                })

    except WebSocketDisconnect:
        room_manager.leave_room(room_id, user_id)
        manager.disconnect(user_id)

        await room_manager.broadcast_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "room_id": room_id
        })
```

### 私聊功能

```python
@app.websocket("/ws/private/{from_user}/{to_user}")
async def websocket_private_chat(
    websocket: WebSocket,
    from_user: str,
    to_user: str
):
    """私聊 WebSocket 端点"""
    await manager.connect(from_user, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # 发送消息给目标用户
            await manager.send_message(to_user, {
                "type": "private_message",
                "from": from_user,
                "content": data.get("content"),
                "timestamp": int(time.time() * 1000)
            })

            # 确认消息已发送
            await manager.send_message(from_user, {
                "type": "message_sent",
                "to": to_user,
                "message_id": data.get("message_id")
            })

    except WebSocketDisconnect:
        manager.disconnect(from_user)
```

### 消息队列和可靠传输

```python
from collections import deque
from dataclasses import dataclass
from typing import Deque

@dataclass
class PendingMessage:
    message_id: str
    user_id: str
    content: dict
    timestamp: int
    retry_count: int = 0

class ReliableMessageQueue:
    """可靠消息队列"""

    def __init__(self, max_retries: int = 3):
        self.pending: Dict[str, Deque[PendingMessage]] = {}
        self.max_retries = max_retries

    def add_message(self, user_id: str, message: PendingMessage):
        """添加待发送消息"""
        if user_id not in self.pending:
            self.pending[user_id] = deque()
        self.pending[user_id].append(message)

    async def process_queue(self, user_id: str):
        """处理用户的消息队列"""
        if user_id not in self.pending:
            return

        while self.pending[user_id]:
            message = self.pending[user_id][0]

            try:
                await manager.send_message(user_id, message.content)
                # 成功发送，从队列移除
                self.pending[user_id].popleft()

            except Exception as e:
                message.retry_count += 1

                if message.retry_count >= self.max_retries:
                    # 超过重试次数，丢弃消息
                    self.pending[user_id].popleft()
                    logger.error(f"消息发送失败，已丢弃: {message.message_id}")
                else:
                    # 等待重试
                    break

message_queue = ReliableMessageQueue()
```

---

## 💾 数据库集成

### PostgreSQL 集成

#### 1. 安装依赖

```bash
pip install sqlalchemy asyncpg alembic
```

#### 2. 数据库配置

```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://user:password@localhost:5432/chatdb"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=20,
    max_overflow=40
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    """数据库会话依赖"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

#### 3. 定义模型

```python
# models.py
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    model = Column(String, default="gpt-3.5-turbo")
    system_prompt = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)
    model = Column(String)
    tokens = Column(Integer)
    timestamp = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
```

#### 4. 数据库操作

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def create_user(db: AsyncSession, user_data: UserRegister):
    """创建用户"""
    user = User(
        id=f"user_{uuid.uuid4().hex[:8]}",
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

async def get_user_conversations(db: AsyncSession, user_id: str):
    """获取用户的所有对话"""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )

    return result.scalars().all()

async def create_conversation(
    db: AsyncSession,
    user_id: str,
    conversation_data: Conversation
):
    """创建对话"""
    conversation = Conversation(
        id=conversation_data.id,
        user_id=user_id,
        title=conversation_data.title,
        model=conversation_data.model,
        system_prompt=conversation_data.systemPrompt
    )

    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return conversation
```

#### 5. 更新 API 端点

```python
@app.post("/api/conversations")
async def create_conversation_endpoint(
    conversation: Conversation,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """创建新对话 (使用数据库)"""
    db_conversation = await create_conversation(db, user_id, conversation)
    return db_conversation
```

### Alembic 迁移

#### 1. 初始化

```bash
alembic init migrations
```

#### 2. 配置 alembic.ini

```ini
sqlalchemy.url = postgresql+asyncpg://user:password@localhost:5432/chatdb
```

#### 3. 创建迁移

```bash
alembic revision --autogenerate -m "Initial migration"
```

#### 4. 执行迁移

```bash
alembic upgrade head
```

---

## 🚀 缓存策略

### Redis 集成

#### 1. 安装依赖

```bash
pip install redis aioredis
```

#### 2. Redis 配置

```python
# cache.py
import redis.asyncio as redis
import json
from typing import Optional, Any

class RedisCache:
    """Redis 缓存管理器"""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 300  # 5 分钟
    ):
        """设置缓存"""
        await self.redis.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )

    async def delete(self, key: str):
        """删除缓存"""
        await self.redis.delete(key)

    async def clear_pattern(self, pattern: str):
        """清除匹配模式的所有键"""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

cache = RedisCache()
```

#### 3. 缓存装饰器

```python
from functools import wraps

def cached(ttl: int = 300, key_prefix: str = ""):
    """缓存装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # 尝试从缓存获取
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # 执行函数
            result = await func(*args, **kwargs)

            # 存入缓存
            await cache.set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator
```

#### 4. 使用缓存

```python
@cached(ttl=600, key_prefix="user_conversations")
async def get_user_conversations_cached(user_id: str):
    """获取用户对话 (带缓存)"""
    # 从数据库获取
    async with AsyncSessionLocal() as db:
        return await get_user_conversations(db, user_id)

@app.get("/api/conversations")
async def get_conversations_endpoint(
    user_id: str = Depends(get_current_user)
):
    """获取对话列表 (使用缓存)"""
    conversations = await get_user_conversations_cached(user_id)
    return conversations
```

### 缓存失效策略

```python
async def invalidate_user_cache(user_id: str):
    """使用户缓存失效"""
    await cache.clear_pattern(f"user_conversations:*:{user_id}*")
    await cache.clear_pattern(f"user_stats:*:{user_id}*")

@app.post("/api/conversations")
async def create_conversation_with_cache_invalidation(
    conversation: Conversation,
    user_id: str = Depends(get_current_user)
):
    """创建对话并清除缓存"""
    # 创建对话
    result = await create_conversation(conversation, user_id)

    # 清除相关缓存
    await invalidate_user_cache(user_id)

    return result
```

---

## 🤖 AI API 集成

### OpenAI 集成

```python
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

async def chat_with_openai(
    messages: List[Message],
    model: str = "gpt-3.5-turbo",
    temperature: float = 0.7,
    max_tokens: int = 2048,
    stream: bool = False
):
    """调用 OpenAI API"""

    formatted_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]

    if stream:
        # 流式响应
        response = await openai.ChatCompletion.acreate(
            model=model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )

        async for chunk in response:
            delta = chunk.choices[0].delta
            if "content" in delta:
                yield delta.content

    else:
        # 普通响应
        response = await openai.ChatCompletion.acreate(
            model=model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return {
            "content": response.choices[0].message.content,
            "tokens": response.usage.total_tokens,
            "model": model
        }
```

### Anthropic Claude 集成

```python
import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def chat_with_claude(
    messages: List[Message],
    model: str = "claude-3-opus-20240229",
    max_tokens: int = 2048,
    temperature: float = 0.7
):
    """调用 Claude API"""

    formatted_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=formatted_messages
    )

    return {
        "content": response.content[0].text,
        "tokens": response.usage.input_tokens + response.usage.output_tokens,
        "model": model
    }
```

### 统一 AI 接口

```python
from enum import Enum

class AIProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"

async def chat_with_ai(
    messages: List[Message],
    provider: AIProvider = AIProvider.OPENAI,
    model: str = None,
    **kwargs
):
    """统一 AI 聊天接口"""

    if provider == AIProvider.OPENAI:
        model = model or "gpt-3.5-turbo"
        return await chat_with_openai(messages, model, **kwargs)

    elif provider == AIProvider.ANTHROPIC:
        model = model or "claude-3-opus-20240229"
        return await chat_with_claude(messages, model, **kwargs)

    else:
        raise ValueError(f"不支持的 AI 提供商: {provider}")

@app.post("/api/chat/ai")
async def chat_with_ai_endpoint(
    request: ChatRequest,
    provider: AIProvider = AIProvider.OPENAI,
    user_id: str = Depends(get_current_user)
):
    """AI 聊天端点"""
    response = await chat_with_ai(
        messages=request.messages,
        provider=provider,
        model=request.model,
        temperature=request.temperature,
        max_tokens=request.max_tokens
    )

    return response
```

---

## ⚡ 性能调优

### 1. 连接池优化

```python
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # 连接池大小
    max_overflow=40,       # 最大溢出连接
    pool_timeout=30,       # 获取连接超时
    pool_recycle=3600,     # 连接回收时间
    pool_pre_ping=True     # 连接前测试
)
```

### 2. 响应压缩

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### 3. 异步批量操作

```python
import asyncio

async def batch_process_messages(message_ids: List[str]):
    """批量处理消息"""
    tasks = [process_message(msg_id) for msg_id in message_ids]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### 4. 查询优化

```python
from sqlalchemy.orm import selectinload

async def get_conversation_with_messages(db: AsyncSession, conv_id: str):
    """获取对话及其消息 (优化查询)"""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.messages))
    )

    return result.scalar_one_or_none()
```

### 5. 请求限流

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/chat")
@limiter.limit("10/minute")
async def rate_limited_chat(request: Request, chat_request: ChatRequest):
    """限流的聊天端点"""
    # 处理聊天请求
    pass
```

---

## 🔒 安全最佳实践

### 1. 密码强度验证

```python
import re

def validate_password_strength(password: str) -> bool:
    """验证密码强度"""
    # 至少8个字符
    if len(password) < 8:
        return False

    # 包含大小写字母、数字和特殊字符
    has_upper = re.search(r'[A-Z]', password)
    has_lower = re.search(r'[a-z]', password)
    has_digit = re.search(r'\d', password)
    has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)

    return all([has_upper, has_lower, has_digit, has_special])

@app.post("/api/auth/register")
async def register_with_validation(user: UserRegister):
    """注册用户 (带密码验证)"""
    if not validate_password_strength(user.password):
        raise HTTPException(
            status_code=400,
            detail="密码强度不足。需要至少8个字符，包含大小写字母、数字和特殊字符。"
        )

    # 继续注册流程
    ...
```

### 2. SQL 注入防护

```python
# 使用参数化查询 (SQLAlchemy 自动处理)
async def safe_query(db: AsyncSession, username: str):
    """安全的查询"""
    # 正确 - 使用参数化查询
    result = await db.execute(
        select(User).where(User.username == username)
    )

    # 错误 - 不要这样做!
    # query = f"SELECT * FROM users WHERE username = '{username}'"
```

### 3. XSS 防护

```python
from html import escape

def sanitize_input(text: str) -> str:
    """清理用户输入"""
    return escape(text)

@app.post("/api/messages")
async def create_message(content: str):
    """创建消息 (清理输入)"""
    sanitized_content = sanitize_input(content)
    # 使用清理后的内容
    ...
```

### 4. CSRF 防护

```python
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel

class CsrfSettings(BaseModel):
    secret_key: str = "your-secret-key"

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

csrf_protect = CsrfProtect()

@app.post("/api/important-action")
async def protected_action(
    csrf_protect: CsrfProtect = Depends()
):
    """CSRF 保护的端点"""
    await csrf_protect.validate_csrf()
    # 执行重要操作
    ...
```

### 5. 敏感数据加密

```python
from cryptography.fernet import Fernet
import os

class Encryptor:
    """数据加密器"""

    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            key = Fernet.generate_key()
        self.cipher = Fernet(key)

    def encrypt(self, data: str) -> str:
        """加密数据"""
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """解密数据"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()

encryptor = Encryptor()

# 加密敏感字段
encrypted_api_key = encryptor.encrypt(api_key)
```

---

## 📊 监控和日志

### 1. Prometheus 集成

```python
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# 定义指标
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    """Prometheus 监控中间件"""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response

@app.get("/metrics")
async def metrics():
    """Prometheus 指标端点"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### 2. 结构化日志

```python
from loguru import logger
import sys

# 配置日志
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

logger.add(
    "logs/app_{time}.log",
    rotation="500 MB",
    retention="10 days",
    compression="zip",
    level="DEBUG"
)

# 使用日志
@app.post("/api/chat")
async def chat_with_logging(request: ChatRequest):
    """带日志的聊天端点"""
    logger.info(f"收到聊天请求: model={request.model}, messages={len(request.messages)}")

    try:
        response = await process_chat(request)
        logger.success(f"聊天成功: tokens={response['tokens']}")
        return response

    except Exception as e:
        logger.error(f"聊天失败: {str(e)}")
        raise
```

### 3. 错误追踪 (Sentry)

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
    environment="production"
)

@app.exception_handler(Exception)
async def sentry_exception_handler(request: Request, exc: Exception):
    """Sentry 异常处理器"""
    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## 🔌 扩展和插件

### 插件系统

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class Plugin(ABC):
    """插件基类"""

    @property
    @abstractmethod
    def name(self) -> str:
        """插件名称"""
        pass

    @abstractmethod
    async def on_message_sent(self, message: Message):
        """消息发送时的钩子"""
        pass

    @abstractmethod
    async def on_conversation_created(self, conversation: Conversation):
        """对话创建时的钩子"""
        pass

class AnalyticsPlugin(Plugin):
    """分析插件示例"""

    @property
    def name(self) -> str:
        return "analytics"

    async def on_message_sent(self, message: Message):
        """记录消息统计"""
        logger.info(f"Analytics: 消息已发送 - {len(message.content)} 字符")

    async def on_conversation_created(self, conversation: Conversation):
        """记录对话创建"""
        logger.info(f"Analytics: 新对话创建 - {conversation.title}")

class PluginManager:
    """插件管理器"""

    def __init__(self):
        self.plugins: Dict[str, Plugin] = {}

    def register(self, plugin: Plugin):
        """注册插件"""
        self.plugins[plugin.name] = plugin
        logger.info(f"插件已注册: {plugin.name}")

    async def trigger_message_sent(self, message: Message):
        """触发消息发送事件"""
        for plugin in self.plugins.values():
            await plugin.on_message_sent(message)

    async def trigger_conversation_created(self, conversation: Conversation):
        """触发对话创建事件"""
        for plugin in self.plugins.values():
            await plugin.on_conversation_created(conversation)

# 全局插件管理器
plugin_manager = PluginManager()

# 注册插件
plugin_manager.register(AnalyticsPlugin())

# 在端点中使用
@app.post("/api/chat")
async def chat_with_plugins(request: ChatRequest):
    """带插件支持的聊天端点"""
    response = await process_chat(request)

    # 触发插件钩子
    await plugin_manager.trigger_message_sent(response)

    return response
```

---

## ❓ 常见问题和解决方案

### 1. 数据库连接池耗尽

**问题:** Too many connections to database

**解决方案:**
```python
# 增加连接池大小
engine = create_async_engine(
    DATABASE_URL,
    pool_size=30,      # 从 20 增加到 30
    max_overflow=60    # 从 40 增加到 60
)

# 确保正确关闭会话
async with AsyncSessionLocal() as session:
    try:
        # 数据库操作
        pass
    finally:
        await session.close()
```

### 2. WebSocket 连接断开

**问题:** WebSocket connection drops unexpectedly

**解决方案:**
```python
# 添加心跳机制
async def heartbeat_task(websocket: WebSocket, user_id: str):
    """心跳任务"""
    while True:
        try:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
        except:
            break

@app.websocket("/ws/{user_id}")
async def websocket_with_heartbeat(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)

    # 启动心跳任务
    heartbeat = asyncio.create_task(heartbeat_task(websocket, user_id))

    try:
        # WebSocket 逻辑
        ...
    finally:
        heartbeat.cancel()
        manager.disconnect(user_id)
```

### 3. 缓存一致性问题

**问题:** Cache shows stale data after updates

**解决方案:**
```python
# 写穿透缓存
async def update_conversation(conversation_id: str, data: dict):
    """更新对话 (清除缓存)"""
    # 更新数据库
    await db_update_conversation(conversation_id, data)

    # 立即清除缓存
    await cache.delete(f"conversation:{conversation_id}")
    await cache.clear_pattern(f"user_conversations:*")
```

### 4. 性能瓶颈

**问题:** API responses are slow

**解决方案:**
```python
# 使用索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

# 使用预加载
result = await db.execute(
    select(Conversation)
    .options(selectinload(Conversation.messages))
    .where(Conversation.id == conv_id)
)

# 使用缓存
@cached(ttl=300)
async def expensive_operation():
    # 昂贵的操作
    pass
```

---

## 🎓 最佳实践总结

### 代码组织
- ✅ 使用依赖注入
- ✅ 分离业务逻辑和数据访问
- ✅ 使用类型提示
- ✅ 编写文档字符串

### 性能
- ✅ 使用异步操作
- ✅ 实现缓存策略
- ✅ 优化数据库查询
- ✅ 使用连接池

### 安全
- ✅ 验证所有输入
- ✅ 使用参数化查询
- ✅ 加密敏感数据
- ✅ 实现速率限制

### 监控
- ✅ 记录结构化日志
- ✅ 收集性能指标
- ✅ 设置告警规则
- ✅ 错误追踪

---

**完整的高级使用指南！现在你可以构建企业级的 AI Chat Studio 后端了！** 🚀
