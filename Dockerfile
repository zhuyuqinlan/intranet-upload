FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制项目文件
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY web/package.json ./web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY server ./server
COPY web ./web

# 构建项目
RUN pnpm build

# 生产镜像
FROM node:18-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/web/dist ./web/dist

# 创建必要目录
RUN mkdir -p data/uploads data/temp

# 暴露端口
EXPOSE 9000

# 启动应用
CMD ["node", "server/dist/main.js"]
