# ================================
# 前端 Dockerfile (多阶段构建)
# ================================

# 阶段 1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建参数 (用于传递环境变量)
ARG VITE_APP_ENV=production
ARG VITE_BACKEND_API_URL
ARG VITE_OPENAI_API_KEY
ARG VITE_ANTHROPIC_API_KEY
ARG VITE_GOOGLE_API_KEY

# 设置环境变量
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

# 构建应用
RUN pnpm run build

# 阶段 2: 生产阶段
FROM nginx:alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
