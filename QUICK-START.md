# 🚀 AI Chat Studio - 快速开始指南

本指南将帮助你在 **5 分钟内** 启动并运行 AI Chat Studio。

---

## 📋 前置要求

确保已安装以下软件:

- ✅ **Node.js** 18+ ([下载](https://nodejs.org/))
- ✅ **Docker Desktop** ([下载](https://www.docker.com/products/docker-desktop/))
- ✅ **Git** ([下载](https://git-scm.com/))

---

## 🎯 5 分钟快速启动

### 步骤 1: 克隆项目

```bash
git clone <your-repo-url>
cd chat-studio
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 设置后端服务

**Windows:**
```bash
setup-services.bat
```

**Linux/macOS:**
```bash
chmod +x setup-services.sh
./setup-services.sh
```

这个脚本会自动:
- 🐘 安装 PostgreSQL
- 🔴 安装 Redis
- 🔮 安装 ChromaDB
- 🔑 生成安全密码
- ⚙️ 创建配置文件

### 步骤 4: 配置 API Keys

编辑 `.env.local` 或 `.env.development`,添加你的 API keys:

```env
# 至少配置一个 AI 服务
VITE_OPENAI_API_KEY=sk-your-openai-key
# 或
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
# 或
VITE_GOOGLE_API_KEY=your-google-key
```

### 步骤 5: 启动应用

**终端 1 - 启动前端:**
```bash
npm run dev
```

**终端 2 - 启动后端 (可选):**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 步骤 6: 打开浏览器

访问: http://localhost:5173

🎉 **开始使用 AI Chat Studio!**

---

## 🔧 常见问题

### Q1: Docker 容器启动失败?

**检查 Docker 是否运行:**
```bash
docker ps
```

**查看容器日志:**
```bash
docker logs chat-studio-postgres
docker logs chat-studio-redis
docker logs chat-studio-chroma
```

**重启容器:**
```bash
docker restart chat-studio-postgres
docker restart chat-studio-redis
docker restart chat-studio-chroma
```

### Q2: 前端连接不到后端?

**检查后端是否运行:**
```bash
curl http://localhost:8000/health
```

**检查 .env 配置:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Q3: 没有 API Key 怎么办?

你可以:

1. **使用 OpenAI** - 访问 https://platform.openai.com/api-keys
2. **使用 Anthropic** - 访问 https://console.anthropic.com/
3. **使用 Google Gemini** - 访问 https://makersuite.google.com/app/apikey
4. **使用本地后端** - 后端会提供模拟 API (开发模式)

### Q4: 导出功能不工作?

确保安装了 `react-hot-toast`:
```bash
npm install react-hot-toast
```

### Q5: 权限错误?

运行安全检查:
```bash
npm run security-check
```

---

## 📱 开发模式特性

在开发模式下,你可以:

- ✅ 热重载 (代码修改自动刷新)
- ✅ 详细的错误信息
- ✅ React DevTools 支持
- ✅ 控制台日志输出
- ✅ 模拟数据 (无需真实 API)

---

## 🏗️ 项目结构

```
chat-studio/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── services/          # API 和业务逻辑
│   ├── store/             # Zustand 状态管理
│   ├── hooks/             # 自定义 Hooks
│   └── pages/             # 页面组件
├── backend/               # Python 后端
│   ├── main.py           # FastAPI 入口
│   ├── api/              # API 路由
│   ├── models/           # 数据模型
│   └── services/         # 业务服务
├── public/               # 静态资源
├── .env.local           # 本地配置 (自动生成)
└── package.json         # NPM 配置
```

---

## 🎨 可用的 NPM 命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 测试
npm run test             # 运行单元测试
npm run test:e2e         # 运行端到端测试
npm run test:coverage    # 生成测试覆盖率报告

# 代码质量
npm run lint             # 检查代码规范
npm run lint:fix         # 自动修复代码问题
npm run typecheck        # TypeScript 类型检查
npm run format           # 格式化代码

# 安全和部署
npm run security-check   # 运行安全检查
npm run setup-services   # 设置后端服务
npm run analyze          # 分析打包体积
```

---

## 🌟 核心功能

### 1. 多模型支持
- OpenAI GPT-4, GPT-3.5
- Anthropic Claude 3
- Google Gemini Pro
- 自定义 API 端点

### 2. 高级功能
- 📝 Markdown 渲染
- 💬 实时流式输出
- 🎨 代码高亮
- 📊 会话分析
- 🔍 全局搜索
- 📤 多格式导出 (Markdown, JSON, PDF, DOCX, etc.)
- 🌙 深色/浅色主题
- 🌐 多语言支持
- 📱 PWA 支持 (可安装)

### 3. 开发者友好
- 🔥 热重载
- 🐛 详细错误信息
- 📖 完整的 TypeScript 类型
- 🧪 单元测试和 E2E 测试
- 📊 性能监控

---

## 🔐 安全注意事项

### 开发环境:
- ✅ 使用 `.env.local` 存储敏感信息
- ✅ `.env.local` 已在 `.gitignore` 中
- ✅ 密码自动生成并保存到独立文件

### 生产环境:
在部署到生产环境前,务必:

1. **运行安全检查:**
   ```bash
   npm run security-check
   ```

2. **使用生产配置:**
   ```bash
   cp .env.production.template .env.production
   # 编辑 .env.production,填写真实的密钥
   ```

3. **检查清单:**
   - [ ] DEBUG_MODE=false
   - [ ] 修改所有默认密钥
   - [ ] 配置 HTTPS
   - [ ] 设置 CORS 白名单
   - [ ] 启用速率限制

详见: [P0-FIXES-SUMMARY.md](./P0-FIXES-SUMMARY.md)

---

## 📚 更多文档

- [完整部署指南](./backend/DEPLOYMENT_CHECKLIST.md)
- [P0 问题修复总结](./P0-FIXES-SUMMARY.md)
- [API 文档](http://localhost:8000/docs) (后端启动后访问)
- [后端集成指南](./backend/BACKEND_INTEGRATION_GUIDE.md)

---

## 🆘 需要帮助?

### 查看日志
```bash
# 前端 (浏览器控制台)
F12 -> Console

# 后端
cd backend && python main.py
# 查看终端输出

# Docker 服务
docker logs chat-studio-postgres
docker logs chat-studio-redis
docker logs chat-studio-chroma
```

### 常用调试命令
```bash
# 检查服务状态
docker ps

# 查看网络连接
netstat -an | grep 5173  # 前端
netstat -an | grep 8000  # 后端
netstat -an | grep 5432  # PostgreSQL
netstat -an | grep 6379  # Redis

# 重启所有服务
docker restart chat-studio-postgres chat-studio-redis chat-studio-chroma
```

---

## 🎓 学习资源

### 技术栈文档:
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FastAPI](https://fastapi.tiangolo.com/)

### AI API 文档:
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude](https://docs.anthropic.com/)
- [Google Gemini](https://ai.google.dev/)

---

## 🤝 贡献

欢迎贡献代码! 请先:

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件

---

## ⭐ Star 历史

如果这个项目对你有帮助,请给我们一个 Star ⭐!

---

**祝你使用愉快! 🎉**

有问题? 查看 [Issues](https://github.com/your-repo/issues) 或创建新的 Issue。
