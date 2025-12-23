# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个局域网文件共享中心，支持分片上传、文件夹管理、批量操作等功能。采用纯前端 + Node.js 后端架构，适合内网环境部署。

## 启动命令

```bash
# 安装依赖
npm install

# 启动服务器（生产/开发环境相同）
npm start
# 或
npm run dev

# 默认运行在 http://localhost:9000（可通过 PORT 环境变量修改）
```

## 架构说明

### 后端架构 (server.js)

- **Express.js**: 主框架，处理 HTTP 请求和静态文件服务
- **Multer**: 处理分片上传，临时存储在 `temp/` 目录
- **文件存储**: 最终文件存储在 `uploads/` 目录，支持文件夹结构
- **元数据管理**: `file-info.json` 存储文件信息（ID、路径、下载次数等）

**关键路由顺序**（必须注意）：
1. `/api/files/batch` - 批量删除（必须在单个文件删除之前）
2. `/api/files/:fileId` - 单个文件操作
3. 其他 API 路由

**分片上传流程**：
1. `/api/upload/init` - 初始化，返回 uploadId 和分片信息
2. `/api/upload/chunk` - 上传分片文件
3. `/api/upload/complete` - 合并分片并创建最终文件

### 前端架构 (index.html)

- **纯原生实现**: 无框架依赖，所有功能通过原生 JavaScript 实现
- **文件管理**: 支持树形目录结构、面包屑导航、搜索过滤
- **批量操作**: 使用 Set 数据结构管理选中文件
- **分片上传**: 使用 SparkMD5 计算文件哈希，支持断点续传
- **UI 风格**: 二次元风格，粉色主题，动画效果

**核心类 ChunkUploader**（分片上传管理）：
- `initUpload(force)` - 初始化上传会话，返回 uploadId 和分片信息
- `calculateHash()` - 使用 SparkMD5 计算文件哈希值
- `uploadChunks()` - 并发上传分片（默认最多 3 个并发）
- `completeUpload()` - 合并分片并完成上传

**前端全局状态**：
- `currentPath` - 当前所在目录路径
- `filesData` - 当前目录的文件列表数据
- `selectedFiles` - Set 结构，存储选中的文件 ID
- `uploadQueue` - 待上传文件队列
- `isUploading` - 上传状态标志位

**关键常量**：
- `CHUNK_SIZE = 5MB` - 前端分片大小（与服务端 10MB 配合使用）
- `MAX_CONCURRENT_UPLOADS = 3` - 最大并发上传数

### 文件结构

```
intranet-upload/
├── server.js              # 后端主文件
├── index.html              # 前端单页面应用
├── package.json            # 项目配置
├── file-info.json          # 文件元数据存储
├── uploads/                # 用户上传文件存储
├── temp/                   # 分片上传临时目录
├── js/
│   └── spark-md5.min.js    # 文件哈希计算库（本地化）
└── css/
    └── fonts.css           # 字体定义（本地化）
```

## 开发注意事项

### 后端核心数据结构

**fileInfoDB** - 文件元数据数据库：
```javascript
{
  files: [
    {
      id: "uuid",           // 文件唯一标识
      path: "/full/path",   // 文件系统绝对路径
      relativePath: "rel",  // 相对于 uploads/ 的路径
      originalName: "name", // 原始文件名
      size: 12345,          // 文件大小
      hash: "md5",          // 文件哈希值
      uploadTime: "ISO",    // 上传时间
      downloadCount: 0      // 下载次数
    }
  ]
}
```

**uploadSessions** - 上传会话 Map：
- 键: uploadId (UUID)
- 值: { filename, fileHash, chunkSize, chunks, fileSize, folderPath, targetPath, createdAt }

### 文件操作

- 所有文件操作使用 `fs.existsSync()` 检查文件存在性
- 删除操作使用 `fs.rmSync()` 递归删除
- 路径处理使用 `path.join()` 和 `path.normalize()` 确保跨平台兼容

### 批量操作实现

批量删除和操作通过以下模式：
```javascript
// 收集选中文件 ID
const fileIds = Array.from(selectedFiles);

// 发送批量请求
fetch('/api/files/batch', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileIds })
});
```

### 分片上传关键点

- 服务端每片 10MB 限制，前端每片 5MB
- 使用 uploadId 标识上传会话，存储在 `uploadSessions` Map 中
- 分片按顺序命名为 `chunk_0`, `chunk_1`, ...
- 完成后按顺序合并分片，使用流式管道避免内存溢出
- 上传完成后自动清理 `temp/uploadId/` 临时目录

### 内网部署考虑

- 所有第三方库已本地化（SparkMD5、字体）
- 静态资源通过 Express 静态中间件提供服务
- 无外部 CDN 依赖，完全离线运行

### 环境配置

- `PORT` - 服务端口，默认 9000
- `UPLOAD_DIR` - 上传文件存储目录，默认 `./uploads`
- `TEMP_DIR` - 分片临时目录，默认 `./temp`
- `FILE_INFO_PATH` - 元数据文件，默认 `./file-info.json`

## 故障排查

### 常见问题

1. **分片上传失败**: 检查 `temp/` 目录权限和磁盘空间
2. **批量删除 404**: 确认路由顺序，`/api/files/batch` 必须在 `/:fileId` 之前
3. **文件合并失败**: 检查分片文件是否完整存在于 `temp/uploadId/` 目录
4. **跨域问题**: 确认 cors 中间件配置正确

### 调试方法

- 查看 `file-info.json` 验证文件元数据
- 检查 `uploads/` 和 `temp/` 目录结构
- 浏览器控制台查看前端错误
- 服务器控制台查看上传/下载日志