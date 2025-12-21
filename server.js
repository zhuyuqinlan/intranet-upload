const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp');
const FILE_INFO_PATH = path.join(__dirname, 'file-info.json');

// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 存储文件信息
let fileInfoDB = { files: [] };
let uploadSessions = new Map();

// 加载文件信息
function loadFileInfo() {
  try {
    if (fs.existsSync(FILE_INFO_PATH)) {
      const data = fs.readFileSync(FILE_INFO_PATH, 'utf8');
      fileInfoDB = JSON.parse(data);
      console.log(`已加载 ${fileInfoDB.files.length} 个文件记录`);
    } else {
      console.log('文件信息数据库不存在，创建新的');
    }
  } catch (err) {
    console.error('加载文件信息失败:', err);
  }
}

// 保存文件信息
function saveFileInfo() {
  try {
    fs.writeFileSync(FILE_INFO_PATH, JSON.stringify(fileInfoDB, null, 2));
  } catch (err) {
    console.error('保存文件信息失败:', err);
  }
}

// 初始化加载
loadFileInfo();

/* ===============================
   Express 中间件
================================ */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

/* ===============================
   文件操作工具函数
================================ */
// 获取相对路径
function getRelativePath(fullPath, basePath = UPLOAD_DIR) {
  return path.relative(basePath, fullPath).replace(/\\/g, '/');
}

// 获取完整路径
function getFullPath(relativePath) {
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  return path.normalize(fullPath);
}

// 检查文件是否存在于指定路径
function fileExistsInPath(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// 递归扫描目录，构建文件树
function scanDirectory(dirPath, relativePath = '') {
  const items = [];

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const relativeFilePath = relativePath ? path.join(relativePath, file) : file;
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // 递归扫描子目录
        const children = scanDirectory(filePath, relativeFilePath);
        items.push({
          id: `dir-${relativeFilePath}`,
          name: file,
          path: relativeFilePath,
          type: 'directory',
          size: children.reduce((sum, item) => sum + (item.size || 0), 0),
          uploadTime: stats.birthtime.toISOString(),
          children: children
        });
      } else {
        // 查找文件信息
        let fileInfo = fileInfoDB.files.find(f => f.path === filePath);

        // 如果文件不存在于数据库中，创建一个记录
        if (!fileInfo) {
          fileInfo = {
            id: uuidv4(),
            path: filePath,
            relativePath: relativeFilePath,
            originalName: file,
            size: stats.size,
            hash: '',
            uploadTime: stats.birthtime.toISOString(),
            downloadCount: 0
          };
          fileInfoDB.files.push(fileInfo);
          saveFileInfo();
        }

        items.push({
          id: fileInfo.id,
          name: file,
          path: relativeFilePath,
          type: 'file',
          size: stats.size,
          uploadTime: fileInfo.uploadTime,
          downloadCount: fileInfo.downloadCount,
          hash: fileInfo.hash
        });
      }
    }
  } catch (err) {
    console.error(`扫描目录失败 ${dirPath}:`, err);
  }

  return items;
}

// 添加或更新文件信息
function addOrUpdateFileInfo(filePath, originalName, size, hash) {
  const relativePath = getRelativePath(filePath);
  const existingIndex = fileInfoDB.files.findIndex(f => f.path === filePath);

  const fileInfo = {
    id: existingIndex >= 0 ? fileInfoDB.files[existingIndex].id : uuidv4(),
    path: filePath,
    relativePath: relativePath,
    originalName: originalName,
    size: size,
    hash: hash,
    uploadTime: new Date().toISOString(),
    downloadCount: existingIndex >= 0 ? fileInfoDB.files[existingIndex].downloadCount : 0
  };

  if (existingIndex >= 0) {
    fileInfoDB.files[existingIndex] = fileInfo;
  } else {
    fileInfoDB.files.push(fileInfo);
  }

  saveFileInfo();
  return fileInfo;
}

// 删除文件或目录
function deleteFileOrDir(filePath) {
  try {
    if (fs.statSync(filePath).isDirectory()) {
      // 递归删除目录
      fs.rmSync(filePath, { recursive: true, force: true });

      // 从数据库中删除该目录下的所有文件
      fileInfoDB.files = fileInfoDB.files.filter(f => !f.path.startsWith(filePath));
    } else {
      // 删除文件
      fs.unlinkSync(filePath);

      // 从数据库中删除
      fileInfoDB.files = fileInfoDB.files.filter(f => f.path !== filePath);
    }
    saveFileInfo();
    return true;
  } catch (err) {
    console.error('删除失败:', err);
    return false;
  }
}


/* ===============================
   Multer 配置 (用于分片上传)
================================ */
const chunkStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadId = req.body.uploadId;
    if (!uploadId) {
      return cb(new Error('缺少uploadId'), null);
    }

    const tempDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    cb(null, tempDir);
  },
  filename(req, _file, cb) {
    const chunkIndex = req.body.chunkIndex;
    if (!chunkIndex && chunkIndex !== 0) {
      return cb(new Error('缺少chunkIndex'), null);
    }
    cb(null, `chunk_${chunkIndex}`);
  }
});

const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per chunk
  }
});

/* ===============================
   路由
================================ */
// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. 初始化上传
app.post('/api/upload/init', (req, res) => {
  try {
    const { filename, fileSize, fileHash, chunkSize, folderPath = '', force = false } = req.body;

    // 检查文件是否已存在
    const targetPath = getFullPath(folderPath ? path.join(folderPath, filename) : filename);
    if (!force && fileExistsInPath(targetPath)) {
      return res.json({
        success: false,
        error: 'FILE_EXISTS',
        message: '文件已存在，是否覆盖？'
      });
    }

    const uploadId = uuidv4();
    const chunks = Math.ceil(fileSize / chunkSize);

    // 创建临时目录
    const tempDir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 检查已存在的分片
    const existingChunks = [];
    try {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        const match = file.match(/^chunk_(\d+)$/);
        if (match) {
          existingChunks.push(parseInt(match[1]));
        }
      });
    } catch (err) {
      // 目录不存在，忽略
    }

    // 存储会话信息
    uploadSessions.set(uploadId, {
      filename,
      fileHash,
      chunkSize,
      chunks,
      fileSize,
      folderPath,
      targetPath,
      createdAt: new Date()
    });

    res.json({
      success: true,
      uploadId,
      chunks,
      existingChunks
    });
  } catch (err) {
    console.error('初始化上传失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 2. 上传分片
app.post('/api/upload/chunk', chunkUpload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    const session = uploadSessions.get(uploadId);

    if (!session) {
      return res.status(404).json({ error: '上传会话不存在' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '分片文件缺失' });
    }

  
    // 文件已经通过multer保存到了正确位置，只需要更新会话信息
    const uploaded = parseInt(chunkIndex) + 1;

    res.json({
      success: true,
      uploaded: uploaded,
      total: session.chunks
    });
  } catch (err) {
    console.error('上传分片失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 3. 完成上传
app.post('/api/upload/complete', async (req, res) => {
  try {
    const { uploadId, filename, fileHash } = req.body;
    const session = uploadSessions.get(uploadId);

    if (!session) {
      return res.status(404).json({ error: '上传会话不存在' });
    }

    // 确保目标目录存在
    const targetDir = path.dirname(session.targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 合并分片
    const tempDir = path.join(TEMP_DIR, uploadId);
    await mergeChunks(tempDir, session.targetPath, session.chunks);

    // 清理临时目录
    cleanupTempDir(uploadId);
    uploadSessions.delete(uploadId);

    // 保存文件信息
    const fileInfo = addOrUpdateFileInfo(
      session.targetPath,
      filename,
      session.fileSize,
      fileHash
    );

    res.json({
      success: true,
      fileId: fileInfo.id,
      filename: filename,
      path: fileInfo.relativePath,
      downloadUrl: `/api/download/${fileInfo.id}`
    });
  } catch (err) {
    console.error('完成上传失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 4. 获取文件列表（网状结构）
app.get('/api/files', (req, res) => {
  try {
    const { path: folderPath = '', search = '' } = req.query;

    // 构建文件树
    const fileTree = scanDirectory(
      folderPath ? getFullPath(folderPath) : UPLOAD_DIR,
      folderPath
    );

    // 如果有搜索关键词，过滤结果
    if (search) {
      const filterItems = (items) => {
        return items.filter(item => {
          if (item.type === 'directory') {
            item.children = filterItems(item.children);
            return item.children.length > 0 || item.name.toLowerCase().includes(search.toLowerCase());
          } else {
            return item.name.toLowerCase().includes(search.toLowerCase());
          }
        });
      };
      fileTree.filterItems = filterItems(fileTree);
    }

    res.json({
      success: true,
      files: fileTree,
      currentPath: folderPath
    });
  } catch (err) {
    console.error('获取文件列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 5. 下载文件
app.get('/api/download/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = fileInfoDB.files.find(f => f.id === fileId);

    if (!fileInfo || !fs.existsSync(fileInfo.path)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 更新下载次数
    fileInfo.downloadCount++;
    saveFileInfo();

    res.download(fileInfo.path, fileInfo.originalName);
  } catch (err) {
    console.error('下载失败:', err);
    res.status(500).json({ error: '下载失败' });
  }
});

// 7. 批量删除 - 必须放在单个文件删除之前
app.delete('/api/files/batch', (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ error: '参数错误' });
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const fileId of fileIds) {
      const fileInfo = fileInfoDB.files.find(f => f.id === fileId);
      if (fileInfo) {
        if (deleteFileOrDir(fileInfo.path)) {
          successCount++;
        } else {
          failCount++;
          errors.push(`删除失败: ${fileInfo.originalName}`);
        }
      } else {
        failCount++;
        errors.push(`文件不存在: ${fileId}`);
      }
    }

    res.json({
      success: true,
      deleted: successCount,
      failed: failCount,
      errors: errors
    });
  } catch (err) {
    console.error('批量删除失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 6. 删除单个文件
app.delete('/api/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = fileInfoDB.files.find(f => f.id === fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: '文件不存在' });
    }

    if (deleteFileOrDir(fileInfo.path)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (err) {
    console.error('删除文件失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 8. 创建文件夹
app.post('/api/folders', (req, res) => {
  try {
    const { name, parentPath = '' } = req.body;
    const folderPath = parentPath ? path.join(parentPath, name) : name;
    const fullPath = getFullPath(folderPath);

    if (fs.existsSync(fullPath)) {
      return res.status(400).json({ error: '文件夹已存在' });
    }

    fs.mkdirSync(fullPath, { recursive: true });

    res.json({
      success: true,
      path: folderPath
    });
  } catch (err) {
    console.error('创建文件夹失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/* ===============================
   工具函数
================================ */
async function mergeChunks(tempDir, finalPath, chunkCount) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(finalPath);
    let currentChunk = 0;

    function writeNextChunk() {
      if (currentChunk >= chunkCount) {
        writeStream.end();
        return;
      }

      const chunkPath = path.join(tempDir, `chunk_${currentChunk}`);

      if (!fs.existsSync(chunkPath)) {
        writeStream.destroy();
        return reject(new Error(`分片 ${currentChunk} 不存在`));
      }

      const readStream = fs.createReadStream(chunkPath);

      readStream.on('end', () => {
        currentChunk++;
        writeNextChunk();
      });

      readStream.on('error', (err) => {
        reject(err);
      });

      readStream.pipe(writeStream, { end: false });
    }

    writeStream.on('finish', () => {
      resolve();
    });

    writeStream.on('error', (err) => {
      reject(err);
    });

    writeNextChunk();
  });
}

function cleanupTempDir(uploadId) {
  const tempDir = path.join(TEMP_DIR, uploadId);
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('清理临时目录失败:', err);
  }
}


/* ===============================
   启动服务器
================================ */
// 启动时清理temp目录
try {
  if (fs.existsSync(TEMP_DIR)) {
    const files = fs.readdirSync(TEMP_DIR);
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    });
    console.log('已清理临时目录');
  }
} catch (err) {
  console.error('清理临时目录失败:', err);
}

app.listen(PORT, () => {
  console.log('\n🎉｡ﾟ･:☆｡･ﾟ★ﾟ･:☆ﾟ･:★｡ﾟ･ﾟ☆:｡･ﾟ★ﾟ･:☆｡･ﾟ☆ﾟ･:★｡ﾟ･:*:･ﾟ☆｡･:*:･ﾟ★ﾟ･:☆｡･:*:.｡･:*ﾟ☆ﾟ･:☆｡.｡:*:☆ﾟ･:*｡･ﾟ★ﾟ･:☆｡･:*:･ﾟ☆:｡･:*:.｡･:*:･ﾟ★ﾟ☆*ﾟ･:*:･ﾟ☆:｡･:*:.｡･:*:*ﾟ･:*:･ﾟ☆★*ﾟ･:*:･ﾟ☆');
  console.log('🌸 局域网文件中心启动成功！' + ' '.repeat(20) + '✨');
  console.log('🌟 访问地址:'.padEnd(20, '.') + `http://localhost:${PORT} 🎀`);
  console.log('📁 文件存储:'.padEnd(20, '.') + `${UPLOAD_DIR} 📦`);
  console.log('💝 感谢使用，祝您使用愉快！'.padEnd(20, '.') + '(｡♥‿♥｡) 💕');
  console.log('\n🎀｡･:*:･ﾟ★ﾟ･:☆ﾟ･:*｡･ﾟ☆｡･:*:.｡･:*:･ﾟ★ﾟ:*:･ﾟ☆｡･:*:･ﾟ★ﾟ･:☆｡･ﾟ☆ﾟ･:★｡ﾟ･:*:･ﾟ☆｡･:*:･ﾟ★ﾟ☆*ﾟ･:*:･ﾟ☆:｡･:*:.｡･:*:*ﾟ･:*:･ﾟ☆★*ﾟ･:*:･ﾟ☆\n');
});