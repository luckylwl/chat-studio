# 🚀 AI Chat Studio - 快速开始指南

**5分钟快速上手指南**

---

## 📋 前置要求

- ✅ Node.js 16+ (前端)
- ✅ Python 3.9+ (后端)
- ✅ Git

---

## ⚡ 快速启动 (3步)

### 1️⃣ 启动前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问: http://localhost:5173

### 2️⃣ 启动后端

```bash
# 进入backend目录
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 启动后端服务器
python main.py
```

后端地址: http://localhost:8000

### 3️⃣ 测试API

```bash
# 在backend目录运行
python test_api.py
```

---

## 🎯 核心功能快速体验

### 1. 全局搜索 (Ctrl+K)

在任何地方按 `Ctrl+K` 打开全局搜索，可以搜索所有对话中的消息。

### 2. 快速回复模板

点击输入框上方的"模板"按钮，选择预设模板快速输入。

### 3. 性能监控 (Ctrl+Shift+P)

按 `Ctrl+Shift+P` 打开性能监控仪表板，实时查看应用性能。

### 4. 导出对话

点击对话右上角的菜单，选择"导出"，支持7种格式。

### 5. 提示词优化

点击输入框的"优化"按钮，AI会帮你优化提示词质量。

---

## 📡 API测试

### 健康检查

```bash
curl http://localhost:8000/health
```

### 用户注册

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 发送消息

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "messages": [{"id": "1", "content": "你好", "role": "user", "timestamp": 1697467200000}],
    "model": "gpt-3.5-turbo"
  }'
```

---

## 🐳 Docker快速启动

```bash
# 一键启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 🔍 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 全局搜索 |
| `Ctrl+Shift+P` | 性能监控 |
| `Ctrl+B` | 创建对话分支 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Ctrl+/` | 快速回复模板 |

---

## 📚 详细文档

- [项目总结](./PROJECT_COMPLETE_SUMMARY.md) - 完整项目文档
- [功能详解](./COMPLETE_FEATURE_UPDATE.md) - 功能使用教程
- [后端文档](./backend/README.md) - 后端快速入门
- [集成指南](./backend/BACKEND_INTEGRATION_GUIDE.md) - API集成教程
- [部署指南](./backend/DEPLOYMENT_CHECKLIST.md) - 生产部署清单

---

## ❓ 常见问题

### Q: 后端启动失败?
A: 确保Python 3.9+已安装，运行 `python --version` 检查。

### Q: 前端无法连接后端?
A: 确保后端已启动在 http://localhost:8000。

### Q: CORS错误?
A: 检查 `main.py` 中的 CORS 配置，确保包含前端地址。

### Q: 如何集成真实AI API?
A: 参考 [集成指南](./backend/BACKEND_INTEGRATION_GUIDE.md) 的AI API集成部分。

---

## 🎉 开始使用

现在你已经准备好使用 AI Chat Studio 了!

**推荐下一步:**
1. 尝试所有新功能
2. 阅读完整文档
3. 集成真实AI API
4. 部署到生产环境

---

**祝使用愉快! 🚀**
