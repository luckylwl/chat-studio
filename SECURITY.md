# 安全指南

## 重要提示

本项目是开源软件，代码中**不包含任何真实的 API 密钥、密码或其他敏感信息**。所有配置都需要您自行设置。

## 环境变量配置

### 前端配置

1. 复制 `.env.example` 为 `.env.local`
2. 填入您的 API 密钥：
   ```bash
   cp .env.example .env.local
   ```

3. 编辑 `.env.local`，填入真实值：
   - `VITE_OPENAI_API_KEY` - OpenAI API 密钥
   - `VITE_ANTHROPIC_API_KEY` - Anthropic Claude API 密钥
   - `VITE_GOOGLE_API_KEY` - Google Gemini API 密钥

### 后端配置

1. 复制 `backend/.env.example` 为 `backend/.env`
2. 生成安全密钥：
   ```bash
   # 使用 Python 生成
   python -c "import secrets; print(secrets.token_urlsafe(32))"

   # 或使用 Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. 配置数据库连接字符串和其他环境变量

### Docker 部署配置

1. 复制 `.env.docker.example` 为 `.env`
2. 修改所有密钥和密码
3. 更新 `ALLOWED_ORIGINS` 为您的实际域名

## 安全检查清单

在部署前，请确保：

- [ ] 所有 `.env` 文件都在 `.gitignore` 中
- [ ] 没有在代码中硬编码任何密钥
- [ ] `SECRET_KEY` 和 `JWT_SECRET` 是强随机值（至少32字符）
- [ ] 数据库密码是强密码
- [ ] `ALLOWED_ORIGINS` 仅包含信任的域名
- [ ] 生产环境的 `DEBUG_MODE` 设为 `false`
- [ ] 已修改所有默认密码

## 敏感文件

以下文件**不应**提交到代码库：

- `.env`
- `.env.local`
- `.env.production`
- `backend/.env`
- 任何包含真实 API 密钥或密码的文件

## 报告安全问题

如果您发现安全漏洞，请**不要**公开提交 issue。请通过以下方式私密报告：

1. 发送邮件到项目维护者（邮箱地址请见 package.json）
2. 或创建一个 GitHub Security Advisory

## API 密钥安全

### 客户端存储

本项目在浏览器中存储 API 密钥时：
- 使用 IndexedDB 加密存储
- 密钥仅存储在本地，不发送到任何服务器
- 支持用户自定义加密密钥

### 服务端存储

如果使用后端服务：
- API 密钥使用环境变量配置
- 不在日志中记录敏感信息
- 使用 HTTPS 加密传输

## 生产环境建议

1. **使用 HTTPS**
   - 所有生产环境必须使用 HTTPS
   - 配置 SSL/TLS 证书

2. **环境隔离**
   - 开发、测试、生产环境使用不同的密钥
   - 不要在生产环境使用测试数据

3. **访问控制**
   - 限制数据库访问
   - 配置防火墙规则
   - 使用 CORS 限制跨域访问

4. **日志和监控**
   - 不在日志中记录敏感信息
   - 监控异常访问
   - 定期审查安全日志

5. **依赖更新**
   - 定期更新依赖包
   - 关注安全公告
   - 使用 `npm audit` 检查漏洞

## Docker 安全

使用 Docker 部署时：

1. **不要使用默认密码**
   ```bash
   # 错误示例
   POSTGRES_PASSWORD=password

   # 正确示例
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   ```

2. **限制容器权限**
   - 不要以 root 运行容器
   - 使用最小权限原则

3. **网络隔离**
   - 使用 Docker 内部网络
   - 不暴露不必要的端口

4. **镜像安全**
   - 使用官方镜像
   - 定期更新基础镜像
   - 扫描镜像漏洞

## 最佳实践

1. **密钥轮换**
   - 定期更换 API 密钥
   - 更换密钥后更新所有环境

2. **备份**
   - 加密备份数据
   - 安全存储备份文件

3. **代码审查**
   - 提交前检查是否包含敏感信息
   - 使用 git-secrets 等工具自动检测

4. **用户教育**
   - 指导用户安全使用 API 密钥
   - 提供安全配置文档

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OpenAI API 安全最佳实践](https://platform.openai.com/docs/guides/safety-best-practices)
- [Docker 安全](https://docs.docker.com/engine/security/)

---

**记住：安全是一个持续的过程，不是一次性的任务！**
